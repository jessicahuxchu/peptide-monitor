"use client";

import { useMemo } from "react";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import { useDbResource } from "@/hooks/useDbResource";
import { regulatoryEntries as fallbackRegulatory } from "@/lib/supply-chain/seed-data";
import { skuOpportunities as fallbackSku } from "@/lib/supply-chain/seed-data";
import {
  buildViabilityIndex,
  summarizeByActionTier,
  type ViabilityAssessment,
} from "@/lib/product-monitor/viability";

const intelligenceFallback = {
  signals: [],
  skuOpportunities: fallbackSku,
};

export function useProductViability() {
  const { data: monitor, loading: monitorLoading } = useProductMonitor();
  const { data: intel, loading: intelLoading } = useDbResource(
    "/api/intelligence",
    intelligenceFallback,
  );
  const { data: regulatoryEntries, loading: regulatoryLoading } = useDbResource(
    "/api/regulatory",
    fallbackRegulatory,
  );

  const ready = !monitorLoading && !intelLoading && !regulatoryLoading;

  const skuByProduct = useMemo(() => {
    const map = new Map<string, (typeof intel.skuOpportunities)[number]>();
    for (const sku of intel.skuOpportunities) {
      map.set(sku.product.toLowerCase(), sku);
    }
    return map;
  }, [intel.skuOpportunities]);

  const index = useMemo(() => {
    if (!ready) return new Map<string, ViabilityAssessment>();
    return buildViabilityIndex(monitor.records, {
      skuByProduct,
      signals: intel.signals,
      regulatoryEntries,
    });
  }, [ready, monitor.records, skuByProduct, intel.signals, regulatoryEntries]);

  const summary = useMemo(
    () =>
      ready
        ? summarizeByActionTier(monitor.records, index)
        : { core: 0, trial: 0, avoid: 0, avgCoverage: 0, highRisk: 0 },
    [ready, monitor.records, index],
  );

  const getAssessment = (recordId: string): ViabilityAssessment | undefined =>
    index.get(recordId);

  return { index, summary, skuByProduct, regulatoryEntries, ready };
}
