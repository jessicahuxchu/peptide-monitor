"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDbResource } from "@/hooks/useDbResource";
import {
  monitorMeta,
  platforms,
  productBlends,
  productMonitorRecords,
} from "@/lib/product-monitor/seed-data";
import type {
  MonitorMeta,
  PlatformDefinition,
  ProductBlend,
  ProductMonitorRecord,
} from "@/lib/product-monitor/types";

export interface ProductMonitorData {
  meta: MonitorMeta;
  platforms: PlatformDefinition[];
  records: ProductMonitorRecord[];
  blends: ProductBlend[];
}

const fallback: ProductMonitorData = {
  meta: monitorMeta,
  platforms,
  records: productMonitorRecords,
  blends: productBlends,
};

const ProductMonitorContext = createContext<{
  data: ProductMonitorData;
  usingDb: boolean;
  loading: boolean;
} | null>(null);

export function ProductMonitorProvider({ children }: { children: ReactNode }) {
  const { data, usingDb, loading } = useDbResource("/api/product-monitor", fallback);

  return (
    <ProductMonitorContext.Provider value={{ data, usingDb, loading }}>
      {children}
    </ProductMonitorContext.Provider>
  );
}

export function useProductMonitor() {
  const ctx = useContext(ProductMonitorContext);
  if (!ctx) {
    return { data: fallback, usingDb: false, loading: false };
  }
  return ctx;
}

export function getBlendsForProductFromData(
  data: ProductMonitorData,
  productId: string,
) {
  const record = data.records.find((r) => r.id === productId);
  if (!record) return [];
  return data.blends.filter((b) => record.commonBlends.includes(b.id));
}
