import {
  ENGAGEMENT_REFRESH_COST_PER_RESULT_USD,
  ENGAGEMENT_REFRESH_FAIL_LIMIT,
  ENGAGEMENT_REFRESH_INTERVAL_HOURS,
  ENGAGEMENT_REFRESH_LOOKBACK_DAYS,
  ENGAGEMENT_REFRESH_MAX_POSTS,
} from "./config";
import {
  fetchEngagementSnapshotsViaApify,
  isApifyConfigured,
  type ApifyEngagementSnapshot,
} from "./apify-client";
import { engagementScore, productMentionedInTitle } from "./matcher";
import { rebuildRedditHeatFromDb } from "./heat-aggregator";
import { createServiceClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"];

export interface EngagementRefreshResult {
  ok: boolean;
  configured: boolean;
  candidates: number;
  refreshed: number;
  removed: number;
  failed: number;
  signalsUpserted: number;
  skuOpportunitiesUpserted: number;
  estimatedCostUsd: number;
  apifyRunId?: string;
  errors: string[];
  error?: string;
}

function hoursSince(iso: string, now = Date.now()): number {
  return (now - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function requiredRefreshIntervalHours(ageHours: number): number {
  if (ageHours < 24) return ENGAGEMENT_REFRESH_INTERVAL_HOURS.under24h;
  if (ageHours < 24 * 3) return ENGAGEMENT_REFRESH_INTERVAL_HOURS.day1to3;
  return ENGAGEMENT_REFRESH_INTERVAL_HOURS.day4to7;
}

function isDueForRefresh(row: SocialPostRow, now = Date.now()): boolean {
  const ageHours = hoursSince(row.posted_at, now);
  if (ageHours > ENGAGEMENT_REFRESH_LOOKBACK_DAYS * 24) return false;

  const lastRefresh = row.engagement_refreshed_at ?? row.fetched_at;
  const sinceRefresh = hoursSince(lastRefresh, now);
  return sinceRefresh >= requiredRefreshIntervalHours(ageHours);
}

function titleMentionsAnyProduct(row: SocialPostRow): boolean {
  const products = (row.products as string[]) ?? [];
  return products.some((p) => productMentionedInTitle(row.title, p));
}

function candidateScore(row: SocialPostRow): number {
  const titleBoost = titleMentionsAnyProduct(row) ? 1_000_000 : 0;
  return titleBoost + row.engagement;
}

function toRedditUrl(row: SocialPostRow): string {
  if (row.url?.startsWith("http")) return row.url;
  if (row.permalink?.startsWith("http")) return row.permalink;
  if (row.permalink?.startsWith("/")) {
    return `https://www.reddit.com${row.permalink}`;
  }
  return row.url || row.permalink;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\/(www\.|old\.|new\.)?reddit\.com/, "")
    .replace(/\/+$/, "")
    .split("?")[0];
}

function matchSnapshot(
  row: SocialPostRow,
  byExternalId: Map<string, ApifyEngagementSnapshot>,
  byUrl: Map<string, ApifyEngagementSnapshot>,
): ApifyEngagementSnapshot | undefined {
  const byId = byExternalId.get(row.external_id);
  if (byId) return byId;

  for (const key of [row.url, row.permalink, toRedditUrl(row)]) {
    if (!key) continue;
    const hit = byUrl.get(normalizeKey(key));
    if (hit) return hit;
  }
  return undefined;
}

export function selectEngagementRefreshCandidates(
  rows: SocialPostRow[],
  limit = ENGAGEMENT_REFRESH_MAX_POSTS,
  now = Date.now(),
): SocialPostRow[] {
  const eligible = rows.filter((row) => {
    if (row.platform !== "reddit") return false;
    if (row.removed_at) return false;
    const products = (row.products as string[]) ?? [];
    if (products.length === 0) return false;
    if (hoursSince(row.posted_at, now) > ENGAGEMENT_REFRESH_LOOKBACK_DAYS * 24) {
      return false;
    }
    return isDueForRefresh(row, now);
  });

  eligible.sort((a, b) => {
    const scoreDiff = candidateScore(b) - candidateScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
  });

  return eligible.slice(0, limit);
}

/**
 * Revisit a small set of stored Reddit posts via Apify startUrls,
 * update score/comments, mark removals, then rebuild heat signals.
 */
export async function runEngagementRefresh(): Promise<EngagementRefreshResult> {
  if (!isApifyConfigured()) {
    return {
      ok: false,
      configured: false,
      candidates: 0,
      refreshed: 0,
      removed: 0,
      failed: 0,
      signalsUpserted: 0,
      skuOpportunitiesUpserted: 0,
      estimatedCostUsd: 0,
      errors: ["APIFY_API_TOKEN not set"],
      error: "APIFY_API_TOKEN not set",
    };
  }

  const supabase = createServiceClient();
  const since = new Date(
    Date.now() - ENGAGEMENT_REFRESH_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: dbPosts, error: readErr } = await supabase
    .from("social_posts")
    .select("*")
    .eq("platform", "reddit")
    .is("removed_at", null)
    .gte("posted_at", since);
  if (readErr) throw readErr;

  const candidates = selectEngagementRefreshCandidates(dbPosts ?? []);
  const estimatedCostUsd =
    Math.round(candidates.length * ENGAGEMENT_REFRESH_COST_PER_RESULT_USD * 10000) /
    10000;

  if (candidates.length === 0) {
    return {
      ok: true,
      configured: true,
      candidates: 0,
      refreshed: 0,
      removed: 0,
      failed: 0,
      signalsUpserted: 0,
      skuOpportunitiesUpserted: 0,
      estimatedCostUsd: 0,
      errors: [],
    };
  }

  const urls = candidates.map(toRedditUrl).filter((u) => u.startsWith("http"));
  const fetchResult = await fetchEngagementSnapshotsViaApify(urls);

  if (fetchResult.errors.length > 0 && fetchResult.snapshots.length === 0) {
    return {
      ok: false,
      configured: true,
      candidates: candidates.length,
      refreshed: 0,
      removed: 0,
      failed: candidates.length,
      signalsUpserted: 0,
      skuOpportunitiesUpserted: 0,
      estimatedCostUsd,
      apifyRunId: fetchResult.runId,
      errors: fetchResult.errors,
      error: fetchResult.errors[0],
    };
  }

  const byExternalId = new Map(
    fetchResult.snapshots.map((s) => [s.externalId, s]),
  );
  const byUrl = new Map<string, ApifyEngagementSnapshot>();
  for (const snap of fetchResult.snapshots) {
    if (snap.url) byUrl.set(normalizeKey(snap.url), snap);
  }

  const nowIso = new Date().toISOString();
  let refreshed = 0;
  let removed = 0;
  let failed = 0;

  for (const row of candidates) {
    const snap = matchSnapshot(row, byExternalId, byUrl);

    if (!snap) {
      const failCount = (row.refresh_fail_count ?? 0) + 1;
      const markRemoved = failCount >= ENGAGEMENT_REFRESH_FAIL_LIMIT;
      const { error } = await supabase
        .from("social_posts")
        .update({
          refresh_fail_count: failCount,
          engagement_refreshed_at: nowIso,
          ...(markRemoved ? { removed_at: nowIso } : {}),
        })
        .eq("id", row.id);
      if (error) throw error;
      failed += 1;
      if (markRemoved) removed += 1;
      continue;
    }

    if (snap.removed) {
      const { error } = await supabase
        .from("social_posts")
        .update({
          removed_at: nowIso,
          engagement_refreshed_at: nowIso,
          refresh_fail_count: ENGAGEMENT_REFRESH_FAIL_LIMIT,
        })
        .eq("id", row.id);
      if (error) throw error;
      removed += 1;
      continue;
    }

    const { error } = await supabase
      .from("social_posts")
      .update({
        score: snap.score,
        num_comments: snap.numComments,
        engagement: engagementScore(snap.score, snap.numComments),
        engagement_refreshed_at: nowIso,
        refresh_fail_count: 0,
      })
      .eq("id", row.id);
    if (error) throw error;
    refreshed += 1;
  }

  const heat = await rebuildRedditHeatFromDb({ backfillDays: 7 });

  console.log(
    `[engagement-refresh] candidates=${candidates.length} refreshed=${refreshed} removed=${removed} failed=${failed} estCostUsd≈${estimatedCostUsd}`,
  );

  return {
    ok: true,
    configured: true,
    candidates: candidates.length,
    refreshed,
    removed,
    failed,
    signalsUpserted: heat.signalsUpserted,
    skuOpportunitiesUpserted: heat.skuOpportunitiesUpserted,
    estimatedCostUsd,
    apifyRunId: fetchResult.runId,
    errors: fetchResult.errors,
  };
}
