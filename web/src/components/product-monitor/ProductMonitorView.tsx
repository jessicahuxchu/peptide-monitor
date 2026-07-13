"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { ProductMonitorKpiBar } from "@/components/product-monitor/ProductMonitorKpiBar";
import { ProductDecisionMatrix } from "@/components/product-monitor/ProductDecisionMatrix";
import { ProductDetailPanel } from "@/components/product-monitor/ProductDetailPanel";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";

export function ProductMonitorView() {
  const t = useTranslations("productMonitor");
  const { data, loading } = useProductMonitor();
  const { meta, records: productMonitorRecords } = data;
  const [selectedId, setSelectedId] = useState<string | null>(
    productMonitorRecords[0]?.id ?? null,
  );

  const selected = productMonitorRecords.find((r) => r.id === selectedId) ?? null;

  if (loading && productMonitorRecords.length === 0) {
    return <div className="p-6 text-sm text-command-text-muted">Loading…</div>;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <ProductMonitorKpiBar records={productMonitorRecords} />

      <div className="space-y-4 p-4 md:p-6">
        <CommandCard>
          <div id="decision-matrix" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
            <ProductDecisionMatrix
              records={productMonitorRecords}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            {selected ? (
              <ProductDetailPanel record={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <div className="hidden rounded-xl border border-dashed border-command-border p-6 text-center text-xs text-command-text-muted lg:flex lg:items-center lg:justify-center">
                {t("detail.selectHint")}
              </div>
            )}
          </div>
        </CommandCard>

        <p className="text-[10px] text-command-text-muted">
          {t("sources")}: {meta.sourceFiles.join(" · ")}
        </p>
      </div>
    </div>
  );
}
