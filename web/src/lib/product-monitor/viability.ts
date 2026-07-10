import { getProductRegulatoryRisk } from "@/lib/regulatory/matrix";
import type { IntelSignal } from "@/lib/intelligence/seed-data";
import type { SkuOpportunity } from "@/lib/supply-chain/seed-data";
import type { RegulatoryEntry } from "@/lib/supply-chain/types";
import { coverageToScore, riskToScore } from "./scoring";
import type {
  InventoryTier,
  PlatformPresenceLevel,
  ProductMonitorRecord,
  RiskLevel,
} from "./types";

/** Component scores that roll up into the viability assessment. */
export interface ViabilityBreakdown {
  /** Intel opportunity + social heat momentum */
  marketSignal: number;
  /** Depth-weighted benchmark platform presence */
  platformValidation: number;
  /** Supply chain feasibility + turnover */
  operationalFit: number;
  /** Inverse regulatory pressure (higher = more room to operate) */
  regulatoryAllowance: number;
  /** Sources used for marketSignal (for UI transparency) */
  marketSignalSources: {
    opportunityScore?: number;
    intelHeatScore?: number;
    platformProxy?: boolean;
  };
}

export interface ViabilityAssessment {
  viabilityScore: number;
  breakdown: ViabilityBreakdown;
  actionTier: InventoryTier;
  regulatoryRisk: RiskLevel;
}

const PRESENCE_WEIGHT: Record<PlatformPresenceLevel, number> = {
  0: 0,
  1: 35,
  2: 70,
  3: 100,
};

const WEIGHTS = {
  marketSignal: 0.35,
  platformValidation: 0.3,
  operationalFit: 0.2,
  regulatoryAllowance: 0.15,
} as const;

function clamp(n: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, n)));
}

/** Map intelligence heat impact (-50…80) to 0–100. */
export function normalizeHeatImpact(impact: number): number {
  return clamp(((impact + 50) / 130) * 100);
}

/** Depth-weighted platform presence — stronger listings count more than mere presence. */
export function calcPlatformDepthScore(record: ProductMonitorRecord): number {
  const levels = Object.values(record.platformPresence);
  if (levels.length === 0) return 0;
  const sum = levels.reduce((acc, level) => acc + PRESENCE_WEIGHT[level], 0);
  return clamp(sum / levels.length);
}

/** Aggregate social / intel heat for a product from recent signals. */
export function aggregateIntelHeatForProduct(
  product: string,
  signals: IntelSignal[],
): number | null {
  const key = product.toLowerCase();
  const related = signals.filter((s) =>
    s.products.some((p) => p.toLowerCase() === key),
  );
  if (related.length === 0) return null;

  const avgHeat =
    related.reduce((sum, s) => sum + (s.heatImpact ?? 0), 0) / related.length;
  return normalizeHeatImpact(avgHeat);
}

function calcMarketSignal(
  platformDepth: number,
  opportunityScore?: number,
  intelHeatScore?: number,
): { score: number; sources: ViabilityBreakdown["marketSignalSources"] } {
  const sources: ViabilityBreakdown["marketSignalSources"] = {};

  if (opportunityScore != null) sources.opportunityScore = opportunityScore;
  if (intelHeatScore != null) sources.intelHeatScore = intelHeatScore;

  if (opportunityScore != null && intelHeatScore != null) {
    return {
      score: clamp(opportunityScore * 0.6 + intelHeatScore * 0.4),
      sources,
    };
  }
  if (opportunityScore != null) {
    return { score: opportunityScore, sources };
  }
  if (intelHeatScore != null) {
    return { score: intelHeatScore, sources };
  }

  sources.platformProxy = true;
  return { score: clamp(platformDepth * 0.85), sources };
}

function calcOperationalFit(record: ProductMonitorRecord): number {
  const supply = record.scores?.supplyFeasibility ?? 70;
  const turnover = record.scores?.turnover ?? 60;
  return clamp(supply * 0.5 + turnover * 0.5);
}

function calcRegulatoryAllowance(
  risk: RiskLevel,
  regulatorySensitivity?: number,
): number {
  if (regulatorySensitivity != null) {
    return clamp((1 - regulatorySensitivity) * 100);
  }
  return clamp(100 - riskToScore(risk));
}

/**
 * Derive action tier from viability — answers 该不该做 + 怎么做.
 * core = 核心布局, trial = 小批量试销, avoid = 订单制
 */
export function deriveActionTier(
  viabilityScore: number,
  regulatoryRisk: RiskLevel,
  marketSignal: number,
  regulatorySensitivity?: number,
): InventoryTier {
  const regPressure =
    regulatorySensitivity ?? riskToScore(regulatoryRisk) / 100;

  if (viabilityScore < 32) return "avoid";
  if (regPressure > 0.82 && marketSignal < 38) return "avoid";

  if (viabilityScore >= 58 && marketSignal >= 48) return "core";
  if (viabilityScore >= 40) return "trial";

  return "avoid";
}

export interface ViabilityContext {
  sku?: SkuOpportunity;
  signals?: IntelSignal[];
  regulatoryEntries?: RegulatoryEntry[];
}

export function assessViability(
  record: ProductMonitorRecord,
  context: ViabilityContext = {},
): ViabilityAssessment {
  const matrixRisk = context.regulatoryEntries
    ? getProductRegulatoryRisk(record.product, context.regulatoryEntries)
    : record.auRegulatoryRisk;

  const platformValidation = calcPlatformDepthScore(record);
  const intelHeatScore =
    context.signals && context.signals.length > 0
      ? aggregateIntelHeatForProduct(record.product, context.signals)
      : null;

  const { score: marketSignal, sources } = calcMarketSignal(
    platformValidation,
    context.sku?.opportunityScore,
    intelHeatScore ?? undefined,
  );

  const operationalFit = calcOperationalFit(record);
  const regulatoryAllowance = calcRegulatoryAllowance(
    record.auRegulatoryRisk,
    context.sku?.regulatorySensitivity,
  );

  const viabilityScore = clamp(
    WEIGHTS.marketSignal * marketSignal +
      WEIGHTS.platformValidation * platformValidation +
      WEIGHTS.operationalFit * operationalFit +
      WEIGHTS.regulatoryAllowance * regulatoryAllowance,
  );

  const breakdown: ViabilityBreakdown = {
    marketSignal,
    platformValidation,
    operationalFit,
    regulatoryAllowance,
    marketSignalSources: sources,
  };

  return {
    viabilityScore,
    breakdown,
    actionTier: deriveActionTier(
      viabilityScore,
      record.auRegulatoryRisk,
      marketSignal,
      context.sku?.regulatorySensitivity,
    ),
    regulatoryRisk: matrixRisk,
  };
}

export function buildViabilityIndex(
  records: ProductMonitorRecord[],
  options: {
    skuByProduct: Map<string, SkuOpportunity>;
    signals: IntelSignal[];
    regulatoryEntries: RegulatoryEntry[];
  },
): Map<string, ViabilityAssessment> {
  const index = new Map<string, ViabilityAssessment>();
  for (const record of records) {
    index.set(record.id, assessViability(record, {
      sku: options.skuByProduct.get(record.product.toLowerCase()),
      signals: options.signals,
      regulatoryEntries: options.regulatoryEntries,
    }));
  }
  return index;
}

export function summarizeByActionTier(
  records: ProductMonitorRecord[],
  index: Map<string, ViabilityAssessment>,
) {
  const tiers = records.map((r) => index.get(r.id)?.actionTier ?? r.tier);
  return {
    core: tiers.filter((t) => t === "core").length,
    trial: tiers.filter((t) => t === "trial").length,
    avoid: tiers.filter((t) => t === "avoid").length,
    avgCoverage:
      records.length === 0
        ? 0
        : Math.round(
            records.reduce(
              (sum, r) => sum + coverageToScore(r.platformCoverage, r.platformTotal),
              0,
            ) / records.length,
          ),
    highRisk: records.filter(
      (r) => (index.get(r.id)?.regulatoryRisk ?? r.auRegulatoryRisk) === "high",
    ).length,
  };
}
