import { createServiceClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { classifySocialPosts } from "@/lib/agent/social-classifier";
import { HEAT_THRESHOLDS, PRODUCT_ALIASES } from "./config";
import {
  fetchApifyDatasetPosts,
  getApifyRunStatus,
  isApifyConfigured,
  startApifyRedditRun,
} from "./apify-client";
import { fetchSocialPeptidePosts } from "./social-fetcher";
import { upsertSkuOpportunitiesFromHeat } from "./sku-from-heat";
import type { NormalizedSocialPost } from "./types";

type SocialPostInsert = Database["public"]["Tables"]["social_posts"]["Insert"];
type SignalInsert = Database["public"]["Tables"]["intelligence_signals"]["Insert"];

export type RedditHeatScanPhase = "sync" | "start" | "complete";

export interface ProductHeatStats {
  product: string;
  mentions24h: number;
  mentions7d: number;
  baselineDaily: number;
  engagement24h: number;
  liftRatio: number;
  heatImpact: number;
  trend: "up" | "down" | "stable";
  hasRegulatory: boolean;
  auContext: boolean;
  topPost: NormalizedSocialPost | null;
  promote: boolean;
  promoteReasons: string[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function computeHeatImpact(
  mentions24h: number,
  baselineDaily: number,
  engagement24h: number,
): number {
  const lift =
    mentions24h / Math.max(baselineDaily, 1) - 1;
  const liftComponent = clamp(lift, -1, 3) * 20;
  const engagementComponent = 40 * Math.log1p(engagement24h);
  return Math.round(clamp(engagementComponent + liftComponent, -50, 80));
}

function computeTrend(
  mentions24h: number,
  baselineDaily: number,
): "up" | "down" | "stable" {
  if (baselineDaily <= 0) {
    return mentions24h >= 3 ? "up" : "stable";
  }
  const ratio = mentions24h / baselineDaily;
  if (ratio >= 1.5) return "up";
  if (ratio <= 0.6) return "down";
  return "stable";
}

export function computeProductHeat(
  posts: NormalizedSocialPost[],
): ProductHeatStats[] {
  const products = PRODUCT_ALIASES.map((p) => p.product);

  return products.map((product) => {
    const related = posts.filter((p) => p.products.includes(product));
    const last24h = related.filter((p) => hoursAgo(p.postedAt) <= 24);
    const last7d = related.filter((p) => hoursAgo(p.postedAt) <= 24 * 7);

    const mentions24h = last24h.length;
    const mentions7d = last7d.length;
    const baselineDaily = mentions7d / 7;
    const engagement24h = last24h.reduce((s, p) => s + p.engagement, 0);
    const liftRatio =
      baselineDaily > 0 ? mentions24h / baselineDaily : mentions24h > 0 ? 99 : 0;

    const hasRegulatory = related.some((p) => p.hasRegulatory);
    const auContext = related.some((p) => p.auContext);

    const topPool = last24h.length > 0 ? last24h : last7d;
    const topPost =
      [...topPool].sort((a, b) => b.engagement - a.engagement)[0] ?? null;

    const heatImpact = computeHeatImpact(
      mentions24h,
      baselineDaily,
      engagement24h,
    );
    const trend = computeTrend(mentions24h, baselineDaily);

    const promoteReasons: string[] = [];
    if (
      mentions24h >= HEAT_THRESHOLDS.minMentions24h &&
      liftRatio >= HEAT_THRESHOLDS.mentionLiftRatio
    ) {
      promoteReasons.push("heat_spike");
    }
    if (
      topPost &&
      topPost.engagement >= HEAT_THRESHOLDS.highEngagement &&
      hoursAgo(topPost.postedAt) <= 24 * 3
    ) {
      promoteReasons.push("high_engagement");
    }
    if (
      hasRegulatory &&
      topPost &&
      topPost.engagement >= HEAT_THRESHOLDS.regulatoryMinEngagement
    ) {
      promoteReasons.push("regulatory_keyword");
    }

    // Cold-start: if we have any 7d activity and heat is meaningfully up, still promote once
    if (
      promoteReasons.length === 0 &&
      mentions7d >= HEAT_THRESHOLDS.minMentions24h &&
      trend === "up" &&
      heatImpact >= 15
    ) {
      promoteReasons.push("sustained_uptrend");
    }

    return {
      product,
      mentions24h,
      mentions7d,
      baselineDaily,
      engagement24h,
      liftRatio,
      heatImpact,
      trend,
      hasRegulatory,
      auContext,
      topPost,
      promote: promoteReasons.length > 0,
      promoteReasons,
    };
  });
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildSignal(stats: ProductHeatStats): SignalInsert | null {
  if (!stats.promote || !stats.topPost) return null;

  const date = todayUtcDate();
  const liftPct = Math.round((stats.liftRatio - 1) * 100);
  const liftLabel =
    stats.liftRatio >= 99
      ? "新出现讨论"
      : `${liftPct >= 0 ? "+" : ""}${liftPct}% vs 七日日均`;

  const trendWord =
    stats.trend === "up" ? "上升" : stats.trend === "down" ? "回落" : "平稳";

  const title = `Reddit — ${stats.product} 讨论热度${trendWord}（24h 提及 ${stats.mentions24h}，${liftLabel}）`;

  const top = stats.topPost;
  const summaryParts = [
    `过去 24h 提及 ${stats.mentions24h} 条，近 7 日共 ${stats.mentions7d} 条（日均 ${stats.baselineDaily.toFixed(1)}）。`,
    `代表帖：r/${top.subreddit}「${top.title}」（score ${top.score}，评论 ${top.numComments}）。`,
  ];
  if (stats.hasRegulatory) {
    const reason = stats.topPost?.regulatoryReason;
    summaryParts.push(
      reason
        ? `监管相关：${reason}`
        : "讨论中出现监管/执法相关关键词，建议对照合规矩阵复核。",
    );
  }
  if (stats.promoteReasons.length) {
    summaryParts.push(`触发规则：${stats.promoteReasons.join(", ")}。`);
  }

  return {
    id: `reddit-heat-${stats.product.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${date}`,
    source: "social",
    title,
    summary: summaryParts.join(" "),
    signal_date: date,
    region: stats.auContext || stats.hasRegulatory ? "AU" : "Global",
    products: [stats.product],
    heat_impact: stats.heatImpact,
    regulatory_impact: stats.hasRegulatory ? 20 : 0,
    trend: stats.trend,
    url: top.url,
  };
}

function toRow(post: NormalizedSocialPost): SocialPostInsert {
  return {
    id: post.id,
    platform: post.platform,
    external_id: post.externalId,
    subreddit: post.subreddit,
    title: post.title,
    body: post.body,
    score: post.score,
    num_comments: post.numComments,
    author: post.author,
    permalink: post.permalink,
    url: post.url,
    posted_at: post.postedAt,
    products: post.products,
    has_regulatory: post.hasRegulatory,
    engagement: post.engagement,
    au_context: post.auContext,
    regulatory_reason: post.regulatoryReason ?? null,
    classified_by: post.classifiedBy ?? null,
    fetched_at: new Date().toISOString(),
  };
}

function applyClassification(
  post: NormalizedSocialPost,
  classification: {
    hasRegulatory: boolean;
    auContext: boolean;
    reason: string | null;
    classifiedBy: "agent" | "rules";
  },
): NormalizedSocialPost {
  return {
    ...post,
    hasRegulatory: classification.hasRegulatory,
    auContext: classification.auContext,
    regulatoryReason: classification.reason,
    classifiedBy: classification.classifiedBy,
  };
}

export interface RedditHeatScanResult {
  ok: boolean;
  configured: boolean;
  phase?: RedditHeatScanPhase;
  provider?: "apify" | "reddit" | "none";
  jobId?: string;
  apifyRunId?: string;
  apifyStatus?: string;
  fetched: number;
  upsertedPosts: number;
  signalsUpserted: number;
  skuOpportunitiesUpserted: number;
  productStats: Array<{
    product: string;
    mentions24h: number;
    mentions7d: number;
    heatImpact: number;
    trend: string;
    promote: boolean;
    reasons: string[];
  }>;
  sources: { subredditPulls: number; searchPulls: number };
  errors?: string[];
  error?: string;
  classificationProvider?: "agent" | "rules";
  classifiedPosts?: number;
}

async function ingestFetchedPosts(
  posts: NormalizedSocialPost[],
  provider: RedditHeatScanResult["provider"],
  sources: { subredditPulls: number; searchPulls: number },
): Promise<RedditHeatScanResult> {
  const supabase = createServiceClient();

  const { classifications, provider: classificationProvider } =
    await classifySocialPosts(posts);

  const classifiedById = new Map(
    classifications.map((c) => [c.postId, c]),
  );
  const classifiedPosts = posts.map((post) => {
    const hit = classifiedById.get(post.id);
    return hit ? applyClassification(post, hit) : post;
  });

  let upsertedPosts = 0;
  const rows = classifiedPosts.map(toRow);

  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error } = await supabase.from("social_posts").upsert(chunk, {
      onConflict: "platform,external_id",
    });
    if (error) throw error;
    upsertedPosts += chunk.length;
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: dbPosts, error: readErr } = await supabase
    .from("social_posts")
    .select("*")
    .eq("platform", "reddit")
    .gte("posted_at", since);
  if (readErr) throw readErr;

  const normalized: NormalizedSocialPost[] = (dbPosts ?? []).map((row) => ({
    id: row.id,
    platform: "reddit",
    externalId: row.external_id,
    subreddit: row.subreddit ?? "",
    title: row.title,
    body: row.body,
    score: row.score,
    numComments: row.num_comments,
    author: row.author,
    permalink: row.permalink,
    url: row.url,
    postedAt: row.posted_at,
    products: (row.products as string[]) ?? [],
    hasRegulatory: row.has_regulatory,
    engagement: row.engagement,
    auContext: row.au_context ?? hasAuFromRow(row),
    regulatoryReason: row.regulatory_reason,
    classifiedBy: row.classified_by as NormalizedSocialPost["classifiedBy"],
  }));

  const stats = computeProductHeat(normalized);
  const signals = stats
    .map(buildSignal)
    .filter((s): s is SignalInsert => s !== null);

  let signalsUpserted = 0;
  if (signals.length > 0) {
    const { error: sigErr } = await supabase
      .from("intelligence_signals")
      .upsert(signals, { onConflict: "id" });
    if (sigErr) throw sigErr;
    signalsUpserted = signals.length;
  }

  const skuOpportunitiesUpserted = await upsertSkuOpportunitiesFromHeat(
    supabase,
    stats,
    normalized,
  );

  return {
    ok: true,
    configured: true,
    provider,
    fetched: posts.length,
    upsertedPosts,
    signalsUpserted,
    skuOpportunitiesUpserted,
    classificationProvider,
    classifiedPosts: classifications.length,
    productStats: stats.map((s) => ({
      product: s.product,
      mentions24h: s.mentions24h,
      mentions7d: s.mentions7d,
      heatImpact: s.heatImpact,
      trend: s.trend,
      promote: s.promote,
      reasons: s.promoteReasons,
    })),
    sources,
  };
}

/**
 * Vercel Cron phase 1: start Apify run and return immediately.
 */
export async function runRedditHeatScanStart(): Promise<RedditHeatScanResult> {
  if (!isApifyConfigured()) {
    return {
      ok: false,
      configured: false,
      phase: "start",
      provider: "none",
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources: { subredditPulls: 0, searchPulls: 0 },
      error: "APIFY_API_TOKEN not set",
    };
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("social_scan_jobs")
    .select("*")
    .eq("status", "running")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      configured: true,
      phase: "start",
      provider: "apify",
      jobId: existing.id,
      apifyRunId: existing.apify_run_id,
      apifyStatus: "RUNNING",
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources: { subredditPulls: 2, searchPulls: 2 },
      error: "Apify run already in progress",
    };
  }

  const { runId, datasetId } = await startApifyRedditRun();
  const jobId = `scan-${runId}`;
  const { error } = await supabase.from("social_scan_jobs").insert({
    id: jobId,
    apify_run_id: runId,
    dataset_id: datasetId,
    status: "running",
  });
  if (error) throw error;

  return {
    ok: true,
    configured: true,
    phase: "start",
    provider: "apify",
    jobId,
    apifyRunId: runId,
    apifyStatus: "RUNNING",
    fetched: 0,
    upsertedPosts: 0,
    signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
    productStats: [],
    sources: { subredditPulls: 2, searchPulls: 2 },
  };
}

/**
 * Vercel Cron phase 2: poll Apify once, ingest when ready.
 */
export async function runRedditHeatScanComplete(): Promise<RedditHeatScanResult> {
  if (!isApifyConfigured()) {
    return {
      ok: false,
      configured: false,
      phase: "complete",
      provider: "none",
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources: { subredditPulls: 0, searchPulls: 0 },
      error: "APIFY_API_TOKEN not set",
    };
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: job, error: jobErr } = await supabase
    .from("social_scan_jobs")
    .select("*")
    .eq("status", "running")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (jobErr) throw jobErr;

  if (!job) {
    return {
      ok: true,
      configured: true,
      phase: "complete",
      provider: "apify",
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources: { subredditPulls: 2, searchPulls: 2 },
      error: "No running Apify job to complete",
    };
  }

  const { status, datasetId, statusMessage } = await getApifyRunStatus(job.apify_run_id);

  if (status === "RUNNING") {
    return {
      ok: true,
      configured: true,
      phase: "complete",
      provider: "apify",
      jobId: job.id,
      apifyRunId: job.apify_run_id,
      apifyStatus: status,
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources: { subredditPulls: 2, searchPulls: 2 },
      error: "Apify run still in progress — retry later",
    };
  }

  if (status !== "SUCCEEDED" || !datasetId) {
    await supabase
      .from("social_scan_jobs")
      .update({
        status: "failed",
        error_message: statusMessage ?? status,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return {
      ok: false,
      configured: true,
      phase: "complete",
      provider: "apify",
      jobId: job.id,
      apifyRunId: job.apify_run_id,
      apifyStatus: status,
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources: { subredditPulls: 2, searchPulls: 2 },
      error: `Apify run ${status}: ${statusMessage ?? "failed"}`,
    };
  }

  const fetchResult = await fetchApifyDatasetPosts(datasetId);
  if (fetchResult.posts.length === 0) {
    await supabase
      .from("social_scan_jobs")
      .update({
        status: "failed",
        error_message: fetchResult.errors[0] ?? "No peptide posts matched",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return {
      ok: false,
      configured: true,
      phase: "complete",
      provider: "apify",
      jobId: job.id,
      apifyRunId: job.apify_run_id,
      apifyStatus: status,
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources: fetchResult.sources,
      errors: fetchResult.errors,
      error: "Apify returned no peptide posts",
    };
  }

  const result = await ingestFetchedPosts(
    fetchResult.posts,
    "apify",
    fetchResult.sources,
  );

  await supabase
    .from("social_scan_jobs")
    .update({
      status: "succeeded",
      dataset_id: datasetId,
      fetched: result.fetched,
      upserted_posts: result.upsertedPosts,
      signals_upserted: result.signalsUpserted,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  return { ...result, phase: "complete", jobId: job.id, apifyRunId: job.apify_run_id, apifyStatus: status };
}

/**
 * Daily Reddit heat scan.
 * - sync: local CLI — wait for Apify and ingest (slow)
 * - start / complete: Vercel Cron — async two-phase
 */
export async function runRedditHeatScan(
  phase: RedditHeatScanPhase = "sync",
): Promise<RedditHeatScanResult> {
  if (phase === "start") return runRedditHeatScanStart();
  if (phase === "complete") return runRedditHeatScanComplete();

  const { posts, configured, provider, sources, errors } =
    await fetchSocialPeptidePosts();

  if (!configured) {
    return {
      ok: false,
      configured: false,
      provider,
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources,
      errors,
      error:
        "Social fetch not configured. Set APIFY_API_TOKEN (recommended) or Reddit OAuth credentials.",
    };
  }

  if (posts.length === 0) {
    return {
      ok: false,
      configured: true,
      phase: "sync",
      provider,
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
    skuOpportunitiesUpserted: 0,
      skuOpportunitiesUpserted: 0,
      productStats: [],
      sources,
      errors,
      error:
        provider === "apify"
          ? `Apify run returned no peptide posts. ${errors[0] ?? "Check actor quota and Apify console."}`
          : "Reddit OAuth returned no peptide posts.",
    };
  }

  const result = await ingestFetchedPosts(posts, provider, sources);
  return { ...result, phase: "sync" };
}

function hasAuFromRow(row: {
  title: string;
  body: string;
  has_regulatory: boolean;
  subreddit: string | null;
}): boolean {
  const text = `${row.title}\n${row.body}\n${row.subreddit ?? ""}`.toLowerCase();
  return (
    text.includes("australia") ||
    text.includes("aussie") ||
    text.includes("tga") ||
    text.includes("sydney") ||
    text.includes("melbourne")
  );
}
