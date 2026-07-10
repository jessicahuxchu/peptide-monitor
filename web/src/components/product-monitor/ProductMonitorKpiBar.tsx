"use client";

import { useTranslations } from "next-intl";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import { useProductViability } from "@/hooks/useProductViability";
import type { ProductMonitorRecord } from "@/lib/product-monitor/types";

interface ProductMonitorKpiBarProps {
  records: ProductMonitorRecord[];
}

export function ProductMonitorKpiBar({ records }: ProductMonitorKpiBarProps) {
  const t = useTranslations("productMonitor.kpi");
  const { data } = useProductMonitor();
  const { summary } = useProductViability();

  const items = [
    { label: t("core"), value: summary.core, accent: "text-command-teal-bright" },
    { label: t("trial"), value: summary.trial, accent: "text-command-orange" },
    { label: t("avoid"), value: summary.avoid, accent: "text-command-red" },
    {
      label: t("avgCoverage"),
      value: `${summary.avgCoverage}%`,
      accent: "text-command-text",
    },
    {
      label: t("highRisk"),
      value: summary.highRisk,
      accent: "text-command-red",
    },
    {
      label: t("benchmarkPlatforms"),
      value: data.meta.platformCount,
      accent: "text-command-text-secondary",
    },
  ];

  return (
    <div className="border-b border-command-border bg-command-card/50 px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
              {item.label}
            </span>
            <span className={`text-lg font-bold tabular-nums ${item.accent}`}>
              {item.value}
            </span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-command-text-muted">
          {t("asOf")} {data.meta.benchmarkDate} · {data.meta.productTypeCount}{" "}
          {t("productTypes")} · {data.meta.listingCount} {t("listings")}
        </span>
      </div>
    </div>
  );
}
