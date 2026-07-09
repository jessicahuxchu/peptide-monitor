import { createServiceClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { HEAT_THRESHOLDS, PRODUCT_ALIASES } from "./config";
import {
  fetchRedditPeptidePosts,
  type NormalizedSocialPost,
} from "./reddit-client";

type SocialPostInsert = Database["public"]["Tables"]["social_posts"]["Insert"];
type SignalInsert = Database["public"]["Tables"]["intelligence_signals"]["Insert"];

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
    summaryParts.push("讨论中出现监管/执法相关关键词，建议对照合规矩阵复核。");
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
    fetched_at: new Date().toISOString(),
  };
}

export interface RedditHeatScanResult {
  ok: boolean;
  configured: boolean;
  fetched: number;
  upsertedPosts: number;
  signalsUpserted: number;
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
  error?: string;
}

/**
 * Daily Reddit heat scan: fetch → upsert social_posts → promote heat signals.
 */
export async function runRedditHeatScan(): Promise<RedditHeatScanResult> {
  const { posts, configured, sources } = await fetchRedditPeptidePosts();

  if (!configured) {
    return {
      ok: false,
      configured: false,
      fetched: 0,
      upsertedPosts: 0,
      signalsUpserted: 0,
      productStats: [],
      sources,
      error:
        "Reddit credentials missing. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT.",
    };
  }

  const supabase = createServiceClient();

  let upsertedPosts = 0;
  const rows = posts.map(toRow);

  // Upsert in chunks
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error } = await supabase.from("social_posts").upsert(chunk, {
      onConflict: "platform,external_id",
    });
    if (error) throw error;
    upsertedPosts += chunk.length;
  }

  // Re-read last 7d from DB so heat uses persisted + newly fetched set
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
    auContext: hasAuFromRow(row),
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

  return {
    ok: true,
    configured: true,
    fetched: posts.length,
    upsertedPosts,
    signalsUpserted,
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
