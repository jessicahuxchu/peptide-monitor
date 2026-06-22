"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDbResource } from "@/hooks/useDbResource";
import { salesRecords } from "@/lib/finance/seed-data";
import { intelligenceSignals } from "@/lib/intelligence/seed-data";
import {
  activeDemand,
  agentInsights,
  mapNodes,
  regulatoryBodies,
  riskIndex,
} from "@/lib/mock-data";
import {
  alerts,
  regulatoryEntries,
  riskSignals,
  skuOpportunities,
  supplyChainState,
} from "@/lib/supply-chain/seed-data";
import type { SalesRecord } from "@/lib/finance/seed-data";
import type { IntelSignal } from "@/lib/intelligence/seed-data";
import type {
  AlertItem,
  RiskSignal,
  SkuOpportunity,
} from "@/lib/supply-chain/seed-data";
import type { RegulatoryEntry, SupplyChainState } from "@/lib/supply-chain/types";

export interface DashboardData {
  supplyChain: SupplyChainState;
  alerts: AlertItem[];
  regulatory: RegulatoryEntry[];
  riskSignals: RiskSignal[];
  intelligence: {
    signals: IntelSignal[];
    skuOpportunities: SkuOpportunity[];
  };
  finance: { records: SalesRecord[] };
  config: Record<string, unknown>;
}

const dashboardFallback: DashboardData = {
  supplyChain: supplyChainState,
  alerts,
  regulatory: regulatoryEntries,
  riskSignals,
  intelligence: { signals: intelligenceSignals, skuOpportunities },
  finance: { records: salesRecords },
  config: {
    risk_index: riskIndex,
    active_demand: activeDemand,
    map_nodes: mapNodes,
    regulatory_bodies: regulatoryBodies,
    agent_insights: agentInsights,
  },
};

const DashboardContext = createContext<{
  data: DashboardData;
  usingDb: boolean;
  loading: boolean;
} | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data, usingDb, loading } = useDbResource("/api/dashboard", dashboardFallback);

  return (
    <DashboardContext.Provider value={{ data, usingDb, loading }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    return {
      data: dashboardFallback,
      usingDb: false,
      loading: false,
    };
  }
  return ctx;
}
