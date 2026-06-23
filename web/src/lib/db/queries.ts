import { createServiceClient } from "@/lib/supabase/client";
import {
  mapAlert,
  mapCustomerDemand,
  mapEntity,
  mapIntelSignal,
  mapMonitorMeta,
  mapPlatform,
  mapProductBlend,
  mapProductMonitorRecord,
  mapRiskSignal,
  mapSalesRecord,
  mapSkuOpportunity,
  mapSupplier,
} from "@/lib/db/platform-mappers";
import { fetchSupplyChainState } from "@/lib/db/supply-chain";
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
import type {
  AlertItem,
  EntityRecord,
  RiskSignal,
  SkuOpportunity,
} from "@/lib/supply-chain/seed-data";
import type { RegulatoryEntry } from "@/lib/supply-chain/types";
import type { SupplyChainState } from "@/lib/supply-chain/types";
import { matrixRowsToRegulatoryEntries } from "@/lib/regulatory/compliance-matrix-v6";

/** v6 Excel matrix is the canonical AU regulatory source until DB sync workflow exists. */
export async function fetchRegulatoryEntries(): Promise<RegulatoryEntry[]> {
  return matrixRowsToRegulatoryEntries();
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAlert);
}

export async function fetchRiskSignals(): Promise<RiskSignal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("risk_signals").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(mapRiskSignal);
}

export async function fetchEntities(): Promise<EntityRecord[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("entities").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(mapEntity);
}

export async function fetchIntelligenceData(): Promise<{
  signals: IntelSignal[];
  skuOpportunities: SkuOpportunity[];
}> {
  const supabase = createServiceClient();
  const [signalsRes, skuRes] = await Promise.all([
    supabase.from("intelligence_signals").select("*").order("signal_date", { ascending: false }),
    supabase.from("sku_opportunities").select("*").order("opportunity_score", { ascending: false }),
  ]);
  if (signalsRes.error) throw signalsRes.error;
  if (skuRes.error) throw skuRes.error;
  return {
    signals: (signalsRes.data ?? []).map(mapIntelSignal),
    skuOpportunities: (skuRes.data ?? []).map(mapSkuOpportunity),
  };
}

export async function fetchFinanceData(): Promise<{ records: SalesRecord[] }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sales_records")
    .select("*")
    .order("sale_date");
  if (error) throw error;
  return { records: (data ?? []).map(mapSalesRecord) };
}

export async function fetchRelationsData(): Promise<{
  suppliers: SupplierProfile[];
  demands: CustomerDemand[];
}> {
  const supabase = createServiceClient();
  const [supRes, demRes] = await Promise.all([
    supabase.from("supplier_profiles").select("*").order("name"),
    supabase.from("customer_demands").select("*").order("name"),
  ]);
  if (supRes.error) throw supRes.error;
  if (demRes.error) throw demRes.error;
  return {
    suppliers: (supRes.data ?? []).map(mapSupplier),
    demands: (demRes.data ?? []).map(mapCustomerDemand),
  };
}

export async function fetchProductMonitorData(): Promise<{
  meta: MonitorMeta;
  platforms: PlatformDefinition[];
  records: ProductMonitorRecord[];
  blends: ProductBlend[];
}> {
  const supabase = createServiceClient();
  const [metaRes, platRes, recRes, blendRes] = await Promise.all([
    supabase.from("monitor_meta").select("*").eq("id", "default").maybeSingle(),
    supabase.from("monitor_platforms").select("*").order("sort_order"),
    supabase.from("product_monitor_records").select("*").order("composite_score", { ascending: false }),
    supabase.from("product_blends").select("*").order("name"),
  ]);
  if (metaRes.error) throw metaRes.error;
  if (platRes.error) throw platRes.error;
  if (recRes.error) throw recRes.error;
  if (blendRes.error) throw blendRes.error;
  if (!metaRes.data) throw new Error("Product monitor meta not seeded");

  return {
    meta: mapMonitorMeta(metaRes.data),
    platforms: (platRes.data ?? []).map(mapPlatform),
    records: (recRes.data ?? []).map(mapProductMonitorRecord),
    blends: (blendRes.data ?? []).map(mapProductBlend),
  };
}

export async function fetchPlatformConfig<T>(key: string): Promise<T | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("platform_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.value as T) ?? null;
}

export async function fetchDashboardBundle(): Promise<{
  supplyChain: SupplyChainState;
  alerts: AlertItem[];
  regulatory: RegulatoryEntry[];
  riskSignals: RiskSignal[];
  intelligence: { signals: IntelSignal[]; skuOpportunities: SkuOpportunity[] };
  finance: { records: SalesRecord[] };
  config: Record<string, unknown>;
}> {
  const [supplyChain, alerts, regulatory, riskSignals, intelligence, finance] =
    await Promise.all([
      fetchSupplyChainState(),
      fetchAlerts(),
      fetchRegulatoryEntries(),
      fetchRiskSignals(),
      fetchIntelligenceData(),
      fetchFinanceData(),
    ]);

  const configKeys = [
    "risk_index",
    "active_demand",
    "map_nodes",
    "regulatory_bodies",
    "agent_insights",
  ];
  const config: Record<string, unknown> = {};
  for (const key of configKeys) {
    config[key] = await fetchPlatformConfig(key);
  }

  return {
    supplyChain,
    alerts,
    regulatory,
    riskSignals,
    intelligence,
    finance,
    config,
  };
}
