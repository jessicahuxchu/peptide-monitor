import { createServiceClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import {
  GOOGLE_NEWS_MIN_MENTIONS_7D,
  GOOGLE_NEWS_QUERIES,
  PRODUCT_ALIASES,
} from "./config";
import {
  getApifyRunStatus,
  isApifyConfigured,
} from "./apify-client";
import {
  fetchApifyGoogleNewsDataset,
  fetchGoogleNewsPeptideArticles,
  startApifyGoogleNewsRun,
} from "./google-news-client";
import { pickRepresentativePost, postCountsForProduct } from "./matcher";
import { isConcreteArticleUrl } from "./news-url";
import type { NormalizedSocialPost } from "./types";

type SocialPostInsert = Database["public"]["Tables"]["social_posts"]["Insert"];
type SignalInsert = Database["public"]["Tables"]["intelligence_signals"]["Insert"];

export type GoogleNewsScanPhase = "sync" | "start" | "complete";

export interface GoogleNewsScanResult {
  ok: boolean;
  configured: boolean;
  phase?: GoogleNewsScanPhase;
  provider?: "apify" | "none";
  jobId?: string;
  apifyRunId?: string;
  apifyStatus?: string;
  fetched: number;
  upsertedPosts: number;
  signalsUpserted: number;
  regulatoryPosts: number;
  queryCount: number;
  productStats: Array<{
    product: string;
    mentions7d: number;
    promote: boolean;
    reasons: string[];
  }>;
  errors?: string[];
  error?: string;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcDateFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return todayUtcDate();
  return d.toISOString().slice(0, 10);
}

function productSlug(product: string): string {
  return product.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function toRow(post: NormalizedSocialPost): SocialPostInsert {
  return {
    id: post.id,
    platform: post.platform,
    external_id: post.externalId,
    subreddit: post.subreddit || null,
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

function rowToNormalizedPost(
  row: Database["public"]["Tables"]["social_posts"]["Row"],
): NormalizedSocialPost {
  return {
    id: row.id,
    platform: "google_news",
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
    auContext: row.au_context ?? false,
    regulatoryReason: row.regulatory_reason,
    classifiedBy: row.classified_by as NormalizedSocialPost["classifiedBy"],
    removedAt: row.removed_at ?? null,
  };
}

function buildRegulatorySignals(
  posts: NormalizedSocialPost[],
): SignalInsert[] {
  const signals: SignalInsert[] = [];

  for (const post of posts) {
    if (!post.hasRegulatory) continue;

    const product =
      post.products[0] ??
      (/\bpeptides?\b/i.test(`${post.title}\n${post.body}`) ? "Peptides" : null);
    if (!product) continue;

    const slug = productSlug(product);
    // File under the article’s publish day — never the scrape day.
    const signalDate = utcDateFromIso(post.postedAt);
    signals.push({
      id: `news-legal-${slug}-${signalDate}-${post.externalId.slice(0, 8)}`,
      source: "news_legal",
      title: `News — ${product}: ${post.title}`.slice(0, 200),
      summary: [
        post.body || post.title,
        post.subreddit ? `来源：${post.subreddit}。` : null,
        `发布于：${signalDate}。`,
        "触发规则：regulatory_keyword。",
      ]
        .filter(Boolean)
        .join(" "),
      signal_date: signalDate,
      region: post.auContext ? "AU" : "Global",
      products: post.products.length > 0 ? post.products : [product],
      heat_impact: 0,
      regulatory_impact: post.auContext ? 35 : 25,
      trend: "stable",
      url: post.url,
    });
  }

  return signals;
}

function buildVolumeSignals(
  posts: NormalizedSocialPost[],
  signalDate: string,
): SignalInsert[] {
  const signals: SignalInsert[] = [];
  const products = PRODUCT_ALIASES.map((p) => p.product);

  for (const product of products) {
    const related = posts.filter((p) => postCountsForProduct(p, product));
    if (related.length < GOOGLE_NEWS_MIN_MENTIONS_7D) continue;

    // Skip if already covered heavily by regulatory promotions for this product today
    const hasRegulatory = related.some((p) => p.hasRegulatory);
    if (hasRegulatory) continue;

    const top = pickRepresentativePost(related, product);
    if (!top) continue;

    signals.push({
      id: `news-legal-vol-${productSlug(product)}-${signalDate}`,
      source: "news_legal",
      title: `News — ${product} 近 7 日报道 ${related.length} 条`,
      summary: [
        `近 7 日 Google News 匹配 ${related.length} 条（阈值 ≥ ${GOOGLE_NEWS_MIN_MENTIONS_7D}）。`,
        `代表报道：${top.subreddit ? `${top.subreddit}「` : "「"}${top.title}」。`,
        "触发规则：volume_7d。",
      ].join(" "),
      signal_date: signalDate,
      region: related.some((p) => p.auContext) ? "AU" : "Global",
      products: [product],
      heat_impact: Math.min(30, related.length * 5),
      regulatory_impact: 0,
      trend: related.length >= GOOGLE_NEWS_MIN_MENTIONS_7D * 2 ? "up" : "stable",
      url: top.url,
    });
  }

  return signals;
}

async function promoteNewsSignals(
  supabase: ReturnType<typeof createServiceClient>,
  posts: NormalizedSocialPost[],
): Promise<{ signalsUpserted: number; productStats: GoogleNewsScanResult["productStats"] }> {
  const crawlDate = todayUtcDate();
  const regulatory = buildRegulatorySignals(posts);
  // Volume digests are a crawl-day rollup over the last 7 days of stored posts.
  const volume = buildVolumeSignals(posts, crawlDate);

  // Prefer regulatory over volume for same product: drop volume ids when regulatory exists
  const regulatoryProducts = new Set(
    regulatory.flatMap((s) => (s.products as string[]) ?? []),
  );
  const filteredVolume = volume.filter((s) => {
    const prods = (s.products as string[]) ?? [];
    return !prods.some((p) => regulatoryProducts.has(p));
  });

  const signals = [...regulatory, ...filteredVolume];
  const keepIds = new Set(signals.map((s) => s.id));

  // Drop stale article-level signals that used the scrape day instead of publish day
  // (same article hash suffix, different date in the id). Never delete volume digests.
  const suffixes = [
    ...new Set(posts.map((p) => p.externalId.slice(0, 8)).filter(Boolean)),
  ];
  if (suffixes.length > 0) {
    const { data: existing, error: listErr } = await supabase
      .from("intelligence_signals")
      .select("id")
      .eq("source", "news_legal")
      .like("id", "news-legal-%");
    if (listErr) throw listErr;

    const toDelete = (existing ?? [])
      .map((row) => row.id)
      .filter((id) => {
        if (id.startsWith("news-legal-vol-")) return false;
        if (keepIds.has(id)) return false;
        return suffixes.some((suf) => id.endsWith(`-${suf}`));
      });

    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("intelligence_signals")
        .delete()
        .in("id", toDelete);
      if (delErr) throw delErr;
    }
  }

  if (signals.length > 0) {
    const { error } = await supabase
      .from("intelligence_signals")
      .upsert(signals, { onConflict: "id" });
    if (error) throw error;
  }

  const productStats = PRODUCT_ALIASES.map((entry) => {
    const related = posts.filter((p) => postCountsForProduct(p, entry.product));
    const reasons: string[] = [];
    if (related.some((p) => p.hasRegulatory)) reasons.push("regulatory_keyword");
    if (
      related.length >= GOOGLE_NEWS_MIN_MENTIONS_7D &&
      !related.some((p) => p.hasRegulatory)
    ) {
      reasons.push("volume_7d");
    }
    return {
      product: entry.product,
      mentions7d: related.length,
      promote: reasons.length > 0,
      reasons,
    };
  });

  return { signalsUpserted: signals.length, productStats };
}

async function ingestGoogleNewsPosts(
  posts: NormalizedSocialPost[],
): Promise<GoogleNewsScanResult> {
  const supabase = createServiceClient();
  let upsertedPosts = 0;
  const rows = posts.map(toRow);

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
    .eq("platform", "google_news")
    .is("removed_at", null)
    .gte("posted_at", since);
  if (readErr) throw readErr;

  const normalized = (dbPosts ?? [])
    .map(rowToNormalizedPost)
    // Drop homepage-only “articles” (e.g. SEO farms resolving to news36 root).
    .filter((p) => isConcreteArticleUrl(p.url));
  const { signalsUpserted, productStats } = await promoteNewsSignals(
    supabase,
    normalized,
  );

  return {
    ok: true,
    configured: true,
    provider: "apify",
    fetched: posts.length,
    upsertedPosts,
    signalsUpserted,
    regulatoryPosts: posts.filter((p) => p.hasRegulatory).length,
    queryCount: GOOGLE_NEWS_QUERIES.length,
    productStats,
  };
}

export async function runGoogleNewsScanStart(): Promise<GoogleNewsScanResult> {
  if (!isApifyConfigured()) {
    return {
      ok: false,
      configured: false,
      phase: "start",
      provider: "none",
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
      regulatoryPosts: 0,
      queryCount: 0,
      productStats: [],
      error: "APIFY_API_TOKEN not set",
    };
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("social_scan_jobs")
    .select("*")
    .eq("status", "running")
    .like("id", "news-scan-%")
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
      regulatoryPosts: 0,
      queryCount: GOOGLE_NEWS_QUERIES.length,
      productStats: [],
      error: "Google News Apify run already in progress",
    };
  }

  const { runId, datasetId } = await startApifyGoogleNewsRun();
  const jobId = `news-scan-${runId}`;
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
    regulatoryPosts: 0,
    queryCount: GOOGLE_NEWS_QUERIES.length,
    productStats: [],
  };
}

export async function runGoogleNewsScanComplete(): Promise<GoogleNewsScanResult> {
  if (!isApifyConfigured()) {
    return {
      ok: false,
      configured: false,
      phase: "complete",
      provider: "none",
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
      regulatoryPosts: 0,
      queryCount: 0,
      productStats: [],
      error: "APIFY_API_TOKEN not set",
    };
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: job, error: jobErr } = await supabase
    .from("social_scan_jobs")
    .select("*")
    .eq("status", "running")
    .like("id", "news-scan-%")
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
      regulatoryPosts: 0,
      queryCount: GOOGLE_NEWS_QUERIES.length,
      productStats: [],
      error: "No running Google News job to complete",
    };
  }

  const { status, datasetId, statusMessage } = await getApifyRunStatus(
    job.apify_run_id,
  );

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
      regulatoryPosts: 0,
      queryCount: GOOGLE_NEWS_QUERIES.length,
      productStats: [],
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
      regulatoryPosts: 0,
      queryCount: GOOGLE_NEWS_QUERIES.length,
      productStats: [],
      error: `Apify run ${status}: ${statusMessage ?? "failed"}`,
    };
  }

  const fetchResult = await fetchApifyGoogleNewsDataset(datasetId);
  if (fetchResult.posts.length === 0) {
    await supabase
      .from("social_scan_jobs")
      .update({
        status: "failed",
        error_message: fetchResult.errors[0] ?? "No peptide news matched",
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
      regulatoryPosts: 0,
      queryCount: fetchResult.queryCount,
      productStats: [],
      errors: fetchResult.errors,
      error: "Apify returned no matched peptide news",
    };
  }

  const result = await ingestGoogleNewsPosts(fetchResult.posts);

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

  return {
    ...result,
    phase: "complete",
    jobId: job.id,
    apifyRunId: job.apify_run_id,
    apifyStatus: status,
  };
}

export async function runGoogleNewsScan(
  phase: GoogleNewsScanPhase = "sync",
): Promise<GoogleNewsScanResult> {
  if (phase === "start") return runGoogleNewsScanStart();
  if (phase === "complete") return runGoogleNewsScanComplete();

  const { posts, configured, provider, queryCount, errors } =
    await fetchGoogleNewsPeptideArticles();

  if (!configured) {
    return {
      ok: false,
      configured: false,
      phase: "sync",
      provider,
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
      regulatoryPosts: 0,
      queryCount: 0,
      productStats: [],
      errors,
      error: "APIFY_API_TOKEN not set",
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
      regulatoryPosts: 0,
      queryCount,
      productStats: [],
      errors,
      error: `Google News returned no matched articles. ${errors[0] ?? ""}`.trim(),
    };
  }

  const result = await ingestGoogleNewsPosts(posts);
  return { ...result, phase: "sync" };
}
