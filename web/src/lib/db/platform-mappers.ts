import type { SalesRecord } from "@/lib/finance/seed-data";
import type { IntelSignal } from "@/lib/intelligence/seed-data";
import type {
  MonitorMeta,
  PlatformDefinition,
  ProductBlend,
  ProductMonitorRecord,
} from "@/lib/product-monitor/types";
import type {
  CustomerDemand,
  SupplierProfile,
} from "@/lib/relations/matching";
import type { SocialPost } from "@/lib/social/types";
import type {
  AlertItem,
  EntityRecord,
  RiskSignal,
  SkuOpportunity,
} from "@/lib/supply-chain/seed-data";
import type { RegulatoryEntry } from "@/lib/supply-chain/types";
import type { Database, Json } from "@/lib/supabase/database.types";

type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type RegRow = Database["public"]["Tables"]["regulatory_entries"]["Row"];
type RiskRow = Database["public"]["Tables"]["risk_signals"]["Row"];
type EntityRow = Database["public"]["Tables"]["entities"]["Row"];
type ProductRow = Database["public"]["Tables"]["product_monitor_records"]["Row"];
type BlendRow = Database["public"]["Tables"]["product_blends"]["Row"];
type SignalRow = Database["public"]["Tables"]["intelligence_signals"]["Row"];
type SkuRow = Database["public"]["Tables"]["sku_opportunities"]["Row"];
type SalesRow = Database["public"]["Tables"]["sales_records"]["Row"];
type SupplierRow = Database["public"]["Tables"]["supplier_profiles"]["Row"];
type DemandRow = Database["public"]["Tables"]["customer_demands"]["Row"];
type MetaRow = Database["public"]["Tables"]["monitor_meta"]["Row"];
type PlatformRow = Database["public"]["Tables"]["monitor_platforms"]["Row"];
type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"];

export function mapRegulatory(row: RegRow): RegulatoryEntry {
  return {
    id: row.id,
    market: row.market,
    region: row.region,
    product: row.product,
    regulatoryBody: row.regulatory_body,
    classification: row.classification,
    requirements: (row.requirements as string[]) ?? [],
    operationalConsequence:
      (row as RegRow & { operational_consequence?: string }).operational_consequence ??
      ((row.requirements as string[])?.[0]
        ? `Requires: ${(row.requirements as string[]).slice(0, 2).join(", ")}`
        : "See classification"),
    riskLevel: row.risk_level as RegulatoryEntry["riskLevel"],
    lastUpdated: row.last_updated,
    source: row.source,
  };
}

export function mapAlert(row: AlertRow): AlertItem {
  return {
    id: row.id,
    priority: row.priority as AlertItem["priority"],
    titleKey: row.title_key,
    summaryKey: row.summary_key,
    source: row.source as AlertItem["source"],
    status: row.status as AlertItem["status"],
    createdAt: row.created_at,
    suggestedActions: (row.suggested_actions as string[]) ?? [],
  };
}

export function mapRiskSignal(row: RiskRow): RiskSignal {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity as RiskSignal["severity"],
    titleKey: row.title_key,
    bodyKey: row.body_key,
    affectedNodes: (row.affected_nodes as string[]) ?? [],
    status: row.status as RiskSignal["status"],
  };
}

export function mapEntity(row: EntityRow): EntityRecord {
  return {
    id: row.id,
    type: row.type as EntityRecord["type"],
    name: row.name,
    country: row.country,
    region: row.region ?? undefined,
    contact: row.contact,
    email: row.email,
    products: (row.products as string[]) ?? [],
    cooperationStatus: row.cooperation_status as EntityRecord["cooperationStatus"],
    latestQuote: (row.latest_quote as EntityRecord["latestQuote"]) ?? undefined,
    riskNotes: row.risk_notes ?? undefined,
  };
}

export function mapProductMonitorRecord(row: ProductRow): ProductMonitorRecord {
  return {
    id: row.id,
    product: row.product,
    displayNameZh: row.display_name_zh ?? undefined,
    primarySpec: row.primary_spec,
    category: row.category as ProductMonitorRecord["category"],
    tier: row.tier as ProductMonitorRecord["tier"],
    tierSource: row.tier_source as ProductMonitorRecord["tierSource"],
    platformCoverage: row.platform_coverage,
    platformTotal: row.platform_total,
    platformPresence: row.platform_presence as unknown as ProductMonitorRecord["platformPresence"],
    platformListings: row.platform_listings as unknown as ProductMonitorRecord["platformListings"],
    commonBlends: (row.common_blends as string[]) ?? [],
    specProfile: row.spec_profile as unknown as ProductMonitorRecord["specProfile"],
    supplyMetrics: row.supply_metrics as unknown as ProductMonitorRecord["supplyMetrics"],
    auRegulatoryRisk: row.au_regulatory_risk as ProductMonitorRecord["auRegulatoryRisk"],
    regulatoryNotes: (row.regulatory_notes as string[]) ?? [],
    scores: row.scores as unknown as ProductMonitorRecord["scores"],
    compositeScore: Number(row.composite_score),
    stockingLogic: row.stocking_logic,
    productIntro:
      (row.product_intro as unknown as ProductMonitorRecord["productIntro"]) ?? undefined,
    notes: row.notes ?? undefined,
    lastReviewed: row.last_reviewed ?? "",
  };
}

export function mapProductBlend(row: BlendRow): ProductBlend {
  return {
    id: row.id,
    name: row.name,
    components: row.components as unknown as ProductBlend["components"],
    platformCoverage: row.platform_coverage,
    platformTotal: row.platform_total,
    tier: row.tier as ProductBlend["tier"],
    stockMode: row.stock_mode as ProductBlend["stockMode"],
  };
}

export function mapMonitorMeta(row: MetaRow): MonitorMeta {
  return {
    benchmarkDate: row.benchmark_date,
    platformCount: row.platform_count,
    productTypeCount: row.product_type_count,
    listingCount: row.listing_count,
    sourceFiles: (row.source_files as string[]) ?? [],
    budgetSplit: row.budget_split as MonitorMeta["budgetSplit"],
  };
}

export function mapPlatform(row: PlatformRow): PlatformDefinition {
  return { id: row.id as PlatformDefinition["id"], name: row.name };
}

export function mapIntelSignal(row: SignalRow): IntelSignal {
  const regulatoryImpact = row.regulatory_impact ?? undefined;
  const heatImpact = row.heat_impact ?? undefined;
  const source = row.source as IntelSignal["source"];

  let dimension: IntelSignal["dimension"] = "demand";
  if (source === "social") {
    // Reddit heat signals are demand-first; regulatory only when explicitly scored.
    dimension =
      row.id.startsWith("reddit-heat-") && (regulatoryImpact ?? 0) <= 0
        ? "demand"
        : (regulatoryImpact ?? 0) > 0
          ? "regulatory"
          : "demand";
  } else if (source === "news_legal" || (regulatoryImpact ?? 0) !== 0) {
    dimension = "regulatory";
  } else if (source === "insider" && (heatImpact ?? 0) === 0) {
    dimension = "competitive";
  }

  return {
    id: row.id,
    source,
    title: row.title,
    summary: row.summary,
    date: row.signal_date,
    region: row.region ?? undefined,
    products: (row.products as string[]) ?? [],
    dimension,
    directionLabel:
      source === "social"
        ? dimension === "regulatory"
          ? "Social · regulatory chatter"
          : "Social · demand heat"
        : dimension === "regulatory"
          ? "Regulatory signal"
          : "Market signal",
    pendingMatrixUpdate: dimension === "regulatory" && (regulatoryImpact ?? 0) > 0,
    credibility:
      source === "news_legal" ? "high" : source === "social" ? "medium" : "medium",
    horizon: source === "social" ? "immediate" : "weeks",
    heatImpact,
    regulatoryImpact,
    trend: (row.trend as IntelSignal["trend"]) ?? undefined,
    url: row.url ?? undefined,
  };
}

export function mapSocialPost(row: SocialPostRow): SocialPost {
  return {
    id: row.id,
    platform: row.platform,
    externalId: row.external_id,
    subreddit: row.subreddit,
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
    fetchedAt: row.fetched_at,
    regulatoryReason: row.regulatory_reason,
    classifiedBy: row.classified_by as SocialPost["classifiedBy"],
    auContext: row.au_context,
  };
}

export function mapSkuOpportunity(row: SkuRow): SkuOpportunity {
  return {
    id: row.id,
    product: row.product,
    demandScore: row.demand_score,
    localPrice: row.local_price != null ? Number(row.local_price) : null,
    competitivePrice:
      row.competitive_price != null ? Number(row.competitive_price) : null,
    regulatorySensitivity: Number(row.regulatory_sensitivity),
    opportunityScore: row.opportunity_score,
    trend: row.trend as SkuOpportunity["trend"],
    sparkline: (row.sparkline as number[]) ?? [],
  };
}

export function mapSalesRecord(row: SalesRow): SalesRecord {
  const quantity = Number(row.quantity);
  const revenue = Number(row.revenue);
  const salesUnitPrice = quantity > 0 ? Math.round(revenue / quantity) : 0;
  const costUnitPrice = Math.round(salesUnitPrice * 0.58);
  return {
    id: row.id,
    date: row.sale_date,
    country: row.country,
    region: row.region,
    product: row.product,
    category: row.category,
    quantity,
    unit: row.unit,
    revenue,
    currency: row.currency,
    salesUnitPrice,
    costUnitPrice,
    totalCost: costUnitPrice * quantity,
  };
}

export function mapSupplier(row: SupplierRow): SupplierProfile {
  const products = (row.products as string[]) ?? [];
  const price = Number(row.price);
  const unit = row.unit;
  const moq = row.moq;
  const productOffers = products.map((product) => ({
    product,
    price,
    unit,
    moq,
  }));

  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    email: row.email,
    products,
    productOffers,
    documents: (row.documents as string[]) ?? [],
    country: row.country,
    region: row.region,
  };
}

export function mapCustomerDemand(row: DemandRow): CustomerDemand {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    email: row.email,
    product: row.product,
    quantity: row.quantity,
    targetPrice: Number(row.target_price),
    priceUnit: row.price_unit,
    requiredDocuments: (row.required_documents as string[]) ?? [],
    country: row.country,
    region: row.region,
    status: row.status as CustomerDemand["status"],
  };
}

export function productRecordToRow(
  record: ProductMonitorRecord,
): Database["public"]["Tables"]["product_monitor_records"]["Insert"] {
  return {
    id: record.id,
    product: record.product,
    display_name_zh: record.displayNameZh ?? null,
    primary_spec: record.primarySpec,
    category: record.category,
    tier: record.tier,
    tier_source: record.tierSource,
    platform_coverage: record.platformCoverage,
    platform_total: record.platformTotal,
    platform_presence: record.platformPresence as unknown as Json,
    platform_listings: record.platformListings as unknown as Json,
    common_blends: record.commonBlends as unknown as Json,
    spec_profile: record.specProfile as unknown as Json,
    supply_metrics: record.supplyMetrics as unknown as Json,
    au_regulatory_risk: record.auRegulatoryRisk,
    regulatory_notes: record.regulatoryNotes as unknown as Json,
    scores: record.scores as unknown as Json,
    composite_score: record.compositeScore,
    stocking_logic: record.stockingLogic,
    product_intro: (record.productIntro as unknown as Json) ?? null,
    notes: record.notes ?? null,
    last_reviewed: record.lastReviewed || null,
  };
}
