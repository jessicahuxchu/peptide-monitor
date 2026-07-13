import type { DbClient } from "@/lib/supabase/client";
import { normalizeHeatImpact } from "@/lib/product-monitor/viability";
import { PRODUCT_ALIASES } from "./config";
import type { ProductHeatStats } from "./heat-aggregator";
import { buildDailyMentionSparkline } from "./sparkline";
import type { NormalizedSocialPost } from "./types";

export function socialSkuId(product: string): string {
  return `social-heat-${product.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/**
 * Bridge Reddit heat → product monitor trend column (sku_opportunities).
 * Pricing fields use 0 until DB migration 007 (no quote intel); UI treats ≤0 as no price.
 */
export async function upsertSkuOpportunitiesFromHeat(
  supabase: DbClient,
  stats: ProductHeatStats[],
  posts: NormalizedSocialPost[],
): Promise<number> {
  const active = stats.filter((s) => s.mentions7d > 0);
  const rows = active.map((s) => ({
    id: socialSkuId(s.product),
    product: s.product,
    demand_score: normalizeHeatImpact(s.heatImpact),
    local_price: 0,
    competitive_price: 0,
    regulatory_sensitivity: s.hasRegulatory ? 0.45 : 0.25,
    opportunity_score: 0,
    trend: s.trend,
    sparkline: buildDailyMentionSparkline(posts, s.product, 7),
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("sku_opportunities")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
  }

  const inactiveIds = stats
    .filter((s) => s.mentions7d === 0)
    .map((s) => socialSkuId(s.product));

  if (inactiveIds.length > 0) {
    const { error } = await supabase
      .from("sku_opportunities")
      .delete()
      .in("id", inactiveIds);
    if (error) throw error;
  }

  return rows.length;
}

/** Rebuild sku_opportunities from social_posts already in DB (backfill / local dev). */
export async function syncSkuOpportunitiesFromStoredPosts(
  supabase: DbClient,
  posts: NormalizedSocialPost[],
): Promise<number> {
  const { computeProductHeat } = await import("./heat-aggregator");
  const stats = computeProductHeat(posts);
  return upsertSkuOpportunitiesFromHeat(supabase, stats, posts);
}

export function trackedSocialProducts(): string[] {
  return PRODUCT_ALIASES.map((p) => p.product);
}
