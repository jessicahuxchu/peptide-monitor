export type PlatformId =
  | "elite_peps"
  | "ozpeps"
  | "aussie_peptides"
  | "optic_labs"
  | "rainbow_peptide"
  | "premiumpeps"
  | "bt7"
  | "biolongevity"
  | "limitless"
  | "amino_usa"
  | "gl_vitality"
  | "biov8";

export type PlatformPresenceLevel = 0 | 1 | 2 | 3;

export type InventoryTier = "core" | "trial" | "avoid";

export type ProductCategory =
  | "recovery"
  | "metabolic"
  | "cosmetic"
  | "neuro"
  | "immune"
  | "blend"
  | "other";

export type StockMode =
  | "raw_material"
  | "finished_small_batch"
  | "delayed_fill"
  | "order_only";

export type RiskLevel = "low" | "medium" | "high";

export interface PlatformDefinition {
  id: PlatformId;
  name: string;
}

export interface SpecProfile {
  primarySpecs: string[];
  consensusSpec: string;
  forms: string[];
  notes?: string;
}

export interface SupplyMetrics {
  stockWeeks: string;
  stockMode: StockMode;
  leadTimeDays: number;
  reorderNote?: string;
}

export interface ProductScores {
  platformCoverage: number;
  demand: number;
  supplyFeasibility: number;
  auRegulatoryRisk: number;
  turnover: number;
}

export interface ProductMonitorRecord {
  id: string;
  product: string;
  displayNameZh?: string;
  primarySpec: string;
  category: ProductCategory;
  tier: InventoryTier;
  tierSource: "auto" | "manual";
  platformCoverage: number;
  platformTotal: number;
  platformPresence: Record<PlatformId, PlatformPresenceLevel>;
  platformListings: Partial<Record<PlatformId, string>>;
  commonBlends: string[];
  specProfile: SpecProfile;
  supplyMetrics: SupplyMetrics;
  auRegulatoryRisk: RiskLevel;
  regulatoryNotes: string[];
  scores: ProductScores;
  compositeScore: number;
  stockingLogic: string;
  notes?: string;
  lastReviewed: string;
}

export interface ProductBlend {
  id: string;
  name: string;
  components: { product: string; amount: string }[];
  platformCoverage: number;
  platformTotal: number;
  tier: InventoryTier;
  stockMode: StockMode;
}

export interface MonitorMeta {
  benchmarkDate: string;
  platformCount: number;
  productTypeCount: number;
  listingCount: number;
  sourceFiles: string[];
  budgetSplit: { core: string; trial: string; avoid: string };
}

export type CoverageBand = "high" | "medium" | "low" | "none";

export interface CatalogEntry {
  id: string;
  product: string;
  platformCoverage: number;
  platformTotal: number;
  coverageBand: CoverageBand;
  decisionId?: string;
}
