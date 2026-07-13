import type {
  InventoryTier,
  ProductMonitorRecord,
  ProductScores,
  StockMode,
  SupplyMetrics,
} from "./types";

/**
 * Until per-SKU supply metrics are curated, score every product with the same
 * placeholder profile. Set to `false` when real supply data is available.
 */
export const USE_SIMULATED_SUPPLY_METRICS = true;

/** Placeholder supply profile used while real per-SKU data is pending. */
export const SIMULATED_SUPPLY_METRICS: SupplyMetrics = {
  stockWeeks: "2–4 周",
  stockMode: "finished_small_batch",
  leadTimeDays: 21,
};

const STOCK_MODE_SUPPLY_BASE: Record<StockMode, number> = {
  raw_material: 90,
  delayed_fill: 80,
  finished_small_batch: 65,
  order_only: 35,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, n)));
}

/** Parse free-text stock weeks into a midpoint (weeks). */
export function parseStockWeeksMidpoint(stockWeeks: string): number {
  if (stockWeeks.includes("订单制")) return 0;
  if (stockWeeks.includes("延迟分装")) return 0.5;
  if (stockWeeks.includes("轻库存")) return 1.5;

  const range = stockWeeks.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;

  const single = stockWeeks.match(/(\d+)/);
  if (single) return Number(single[1]);

  return 3;
}

function leadTimeSupplyAdjustment(days: number): number {
  return Math.max(-15, Math.min(10, 10 - (days - 14) * 0.4));
}

function stockWeeksToTurnoverScore(weeks: number): number {
  if (weeks <= 0) return 95;
  if (weeks <= 1) return 88;
  if (weeks <= 3) return 72;
  if (weeks <= 5) return 58;
  if (weeks <= 7) return 45;
  return 35;
}

function leadTimeToTurnoverScore(days: number): number {
  if (days <= 7) return 90;
  if (days <= 14) return 78;
  if (days <= 21) return 65;
  if (days <= 28) return 52;
  if (days <= 35) return 42;
  return 30;
}

export function metricsForSupplyScoring(metrics: SupplyMetrics): SupplyMetrics {
  return USE_SIMULATED_SUPPLY_METRICS ? SIMULATED_SUPPLY_METRICS : metrics;
}

/** Supply feasibility from stock mode + lead time. */
export function calcSupplyFeasibility(metrics: SupplyMetrics): number {
  const m = metricsForSupplyScoring(metrics);
  return clamp(STOCK_MODE_SUPPLY_BASE[m.stockMode] + leadTimeSupplyAdjustment(m.leadTimeDays));
}

/** Turnover from stock weeks + lead time. */
export function calcTurnover(metrics: SupplyMetrics): number {
  const m = metricsForSupplyScoring(metrics);
  const weeksScore = stockWeeksToTurnoverScore(parseStockWeeksMidpoint(m.stockWeeks));
  const leadScore = leadTimeToTurnoverScore(m.leadTimeDays);
  return clamp(weeksScore * 0.6 + leadScore * 0.4);
}

export function resolveSupplyScores(
  metrics: SupplyMetrics,
  overrides?: Partial<Pick<ProductScores, "supplyFeasibility" | "turnover">>,
): Pick<ProductScores, "supplyFeasibility" | "turnover"> {
  if (USE_SIMULATED_SUPPLY_METRICS) {
    return {
      supplyFeasibility: calcSupplyFeasibility(SIMULATED_SUPPLY_METRICS),
      turnover: calcTurnover(SIMULATED_SUPPLY_METRICS),
    };
  }

  return {
    supplyFeasibility: overrides?.supplyFeasibility ?? calcSupplyFeasibility(metrics),
    turnover: overrides?.turnover ?? calcTurnover(metrics),
  };
}

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

  const { supplyFeasibility, turnover } = resolveSupplyScores(
    record.supplyMetrics,
    record.scores,
  );

  const scores: ProductScores = {
    platformCoverage,
    demand: record.scores?.demand ?? platformCoverage,
    supplyFeasibility,
    auRegulatoryRisk:
      record.scores?.auRegulatoryRisk ??
      riskToScore(record.auRegulatoryRisk),
    turnover,
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
