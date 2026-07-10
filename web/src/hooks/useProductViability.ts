"use client";

import { useMemo } from "react";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import { useDbResource } from "@/hooks/useDbResource";
import { regulatoryEntries as fallbackRegulatory } from "@/lib/supply-chain/seed-data";
import { skuOpportunities as fallbackSku } from "@/lib/supply-chain/seed-data";
import { intelligenceSignals as fallbackSignals } from "@/lib/intelligence/seed-data";
import {
  buildViabilityIndex,
  summarizeByActionTier,
  type ViabilityAssessment,
} from "@/lib/product-monitor/viability";

const intelligenceFallback = {
  signals: fallbackSignals,
  skuOpportunities: fallbackSku,
};

export function useProductViability() {
  const { data: monitor } = useProductMonitor();
  const { data: intel } = useDbResource("/api/intelligence", intelligenceFallback);
  const { data: regulatoryEntries } = useDbResource(
    "/api/regulatory",
    fallbackRegulatory,
  );

  const skuByProduct = useMemo(() => {
    const map = new Map<string, (typeof intel.skuOpportunities)[number]>();
    for (const sku of intel.skuOpportunities) {
      map.set(sku.product.toLowerCase(), sku);
    }
    return map;
  }, [intel.skuOpportunities]);

  const index = useMemo(
    () =>
      buildViabilityIndex(monitor.records, {
        skuByProduct,
        signals: intel.signals,
        regulatoryEntries,
      }),
    [monitor.records, skuByProduct, intel.signals, regulatoryEntries],
  );

  const summary = useMemo(
    () => summarizeByActionTier(monitor.records, index),
    [monitor.records, index],
  );

  const getAssessment = (recordId: string): ViabilityAssessment | undefined =>
    index.get(recordId);

  return { index, summary, skuByProduct, regulatoryEntries };
}
