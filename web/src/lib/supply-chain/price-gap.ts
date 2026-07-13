import type { SkuOpportunity } from "./seed-data";

type PriceInputs = Pick<SkuOpportunity, "localPrice" | "competitivePrice">;

/** Price gap only when both our quote and market benchmark are present. */
export function calcPriceGap(sku: PriceInputs | null | undefined): number | null {
  if (!sku) return null;
  const { localPrice, competitivePrice } = sku;
  if (localPrice == null || competitivePrice == null) return null;
  if (!Number.isFinite(localPrice) || !Number.isFinite(competitivePrice)) return null;
  return localPrice - competitivePrice;
}

export function formatPriceGap(gap: number | null): string {
  if (gap == null) return "—";
  return `$${gap > 0 ? "+" : ""}${gap}`;
}
