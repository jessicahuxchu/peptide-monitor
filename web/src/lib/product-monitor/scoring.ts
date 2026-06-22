import type { InventoryTier, ProductMonitorRecord, ProductScores } from "./types";

export function calcCompositeScore(scores: ProductScores): number {
  const raw =
    0.3 * scores.platformCoverage +
    0.2 * scores.demand +
    0.15 * scores.supplyFeasibility +
    0.15 * scores.turnover -
    0.2 * scores.auRegulatoryRisk;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

export function coverageToScore(coverage: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((coverage / total) * 100);
}

export function riskToScore(level: "low" | "medium" | "high"): number {
  if (level === "low") return 20;
  if (level === "medium") return 50;
  return 85;
}

export function autoTier(
  composite: number,
  regulatoryScore: number,
  coverageScore: number,
  explicitTier?: InventoryTier,
): InventoryTier {
  if (explicitTier) return explicitTier;

  if (regulatoryScore >= 70 || composite < 35) return "avoid";
  if (composite >= 70 && regulatoryScore <= 45 && coverageScore >= 75) return "core";
  if (composite >= 45 || coverageScore >= 50) return "trial";
  return "avoid";
}

export function enrichRecordScores(
  record: Omit<ProductMonitorRecord, "compositeScore" | "scores"> & {
    scores?: Partial<ProductScores>;
    compositeScore?: number;
  },
): ProductMonitorRecord {
  const platformCoverage = coverageToScore(
    record.platformCoverage,
    record.platformTotal,
  );

  const scores: ProductScores = {
    platformCoverage,
    demand: record.scores?.demand ?? platformCoverage,
    supplyFeasibility: record.scores?.supplyFeasibility ?? 70,
    auRegulatoryRisk:
      record.scores?.auRegulatoryRisk ??
      riskToScore(record.auRegulatoryRisk),
    turnover: record.scores?.turnover ?? 60,
  };

  const compositeScore = record.compositeScore ?? calcCompositeScore(scores);

  return {
    ...record,
    scores,
    compositeScore,
  };
}

export function summarizeByTier(records: ProductMonitorRecord[]) {
  return {
    core: records.filter((r) => r.tier === "core").length,
    trial: records.filter((r) => r.tier === "trial").length,
    avoid: records.filter((r) => r.tier === "avoid").length,
    avgCoverage:
      records.length === 0
        ? 0
        : Math.round(
            records.reduce(
              (sum, r) => sum + (r.platformCoverage / r.platformTotal) * 100,
              0,
            ) / records.length,
          ),
    highRisk: records.filter((r) => r.auRegulatoryRisk === "high").length,
  };
}
