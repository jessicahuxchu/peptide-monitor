"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { TierBadge } from "@/components/product-monitor/TierBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import type { InventoryTier, ProductMonitorRecord } from "@/lib/product-monitor/types";
import { cn } from "@/lib/utils";

const riskVariant = {
  low: "optimal" as const,
  medium: "delayed" as const,
  high: "critical" as const,
};

interface ProductDecisionMatrixProps {
  records: ProductMonitorRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProductDecisionMatrix({
  records,
  selectedId,
  onSelect,
}: ProductDecisionMatrixProps) {
  const t = useTranslations("productMonitor");
  const { data } = useProductMonitor();
  const platforms = data.platforms;
  const [tierFilter, setTierFilter] = useState<InventoryTier | "all">("all");

  const filtered = useMemo(() => {
    const list =
      tierFilter === "all" ? records : records.filter((r) => r.tier === tierFilter);
    return [...list].sort((a, b) => b.compositeScore - a.compositeScore);
  }, [records, tierFilter]);

  const tiers: (InventoryTier | "all")[] = ["all", "core", "trial", "avoid"];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tiers.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setTierFilter(tier)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
              tierFilter === tier
                ? "border-command-teal/40 bg-command-teal/10 text-command-teal-bright"
                : "border-command-border text-command-text-muted hover:text-command-text-secondary",
            )}
          >
            {tier === "all" ? t("filters.allTiers") : t(`tiers.${tier}`)}
          </button>
        ))}
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-command-border text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
              <th className="pb-3 pr-3">{t("table.product")}</th>
              <th className="pb-3 pr-3">{t("table.tier")}</th>
              <th className="pb-3 pr-3">{t("table.score")}</th>
              <th className="pb-3 pr-3">{t("table.coverage")}</th>
              <th className="pb-3">{t("table.auRisk")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => (
              <tr
                key={record.id}
                onClick={() => onSelect(record.id)}
                className={cn(
                  "cursor-pointer border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/50",
                  selectedId === record.id && "bg-command-teal/5",
                )}
              >
                <td className="py-3 pr-3">
                  <p className="font-semibold text-command-teal-bright">{record.product}</p>
                  <p className="text-[10px] text-command-text-muted">{record.primarySpec}</p>
                </td>
                <td className="py-3 pr-3">
                  <TierBadge tier={record.tier} />
                </td>
                <td className="py-3 pr-3">
                  <span
                    className={cn(
                      "text-lg font-bold tabular-nums",
                      record.compositeScore >= 70
                        ? "text-command-green"
                        : record.compositeScore >= 45
                          ? "text-command-orange"
                          : "text-command-text-secondary",
                    )}
                  >
                    {record.compositeScore}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  <CoverageMiniBar record={record} />
                </td>
                <td className="py-3">
                  <StatusBadge variant={riskVariant[record.auRegulatoryRisk]}>
                    {t(`risk.${record.auRegulatoryRisk}`)}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoverageMiniBar({ record }: { record: ProductMonitorRecord }) {
  const { data } = useProductMonitor();
  const platforms = data.platforms;
  const pct = Math.round((record.platformCoverage / record.platformTotal) * 100);

  return (
    <div className="min-w-[100px]">
      <div className="mb-1 flex gap-px">
        {platforms.map((p) => {
          const level = record.platformPresence[p.id];
          return (
            <span
              key={p.id}
              className={cn(
                "h-3 flex-1 rounded-sm",
                level === 0 && "bg-command-border/50",
                level === 1 && "bg-command-teal/30",
                level === 2 && "bg-command-teal/60",
                level === 3 && "bg-command-teal-bright/80",
              )}
              title={p.name}
            />
          );
        })}
      </div>
      <span className="text-[10px] tabular-nums text-command-text-muted">
        {record.platformCoverage}/{record.platformTotal} ({pct}%)
      </span>
    </div>
  );
}
