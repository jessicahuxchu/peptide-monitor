import type { RegulatoryEntry, RiskLevel } from "@/lib/supply-chain/types";
import { AU_STATES } from "@/lib/finance/seed-data";
import { resolveMatrixProducts } from "@/lib/regulatory/compliance-matrix-v6";

export const FEDERAL_REGION = "Federal";

export const REGULATORY_COLUMNS = [FEDERAL_REGION, ...AU_STATES] as const;
export type RegulatoryColumn = (typeof REGULATORY_COLUMNS)[number];

export interface RegulatoryCell {
  entry: RegulatoryEntry;
  isIncremental: boolean;
}

const riskOrder: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export function isFederalRegion(region: string): boolean {
  return region === FEDERAL_REGION || region === "AU Federal";
}

export function buildRegulatoryMatrix(entries: RegulatoryEntry[]) {
  const products = [...new Set(entries.map((e) => e.product))].sort();
  const cellMap = new Map<string, RegulatoryCell>();

  for (const entry of entries) {
    const col = isFederalRegion(entry.region) ? FEDERAL_REGION : entry.region;
    cellMap.set(`${entry.product}::${col}`, {
      entry,
      isIncremental: !isFederalRegion(entry.region),
    });
  }

  return { products, cellMap };
}

export function getMatrixCell(
  product: string,
  column: RegulatoryColumn,
  cellMap: Map<string, RegulatoryCell>,
): RegulatoryCell | undefined {
  return cellMap.get(`${product}::${column}`);
}

/** Site-wide AU regulatory risk for a product — max across all matrix cells. */
export function getProductRegulatoryRisk(
  product: string,
  entries: RegulatoryEntry[],
): RiskLevel {
  const matrixProducts = resolveMatrixProducts(product);
  const matched =
    matrixProducts.length > 0
      ? entries.filter((e) => matrixProducts.includes(e.product))
      : entries.filter((e) => e.product === product);

  if (matched.length === 0) return "medium";

  return matched.reduce<RiskLevel>(
    (max, e) => (riskOrder[e.riskLevel] > riskOrder[max] ? e.riskLevel : max),
    "low",
  );
}

/** Count intelligence regulatory-chatter signals (not matrix pending updates). */
export function getPendingRegulatorySignals(
  signals: { products: string[]; dimension: string; regulatoryImpact?: number }[],
): number {
  return signals.filter((s) => s.dimension === "regulatory").length;
}
