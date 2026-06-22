"use client";

import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDashboard } from "@/components/providers/DashboardProvider";
import { riskIndex as fallbackRiskIndex } from "@/lib/mock-data";

const statusVariant = {
  optimal: "optimal",
  delayed: "delayed",
} as const;

export function GlobalRiskIndex() {
  const t = useTranslations("risk");
  const { data } = useDashboard();
  const riskIndex =
    (data.config.risk_index as typeof fallbackRiskIndex | null) ?? fallbackRiskIndex;

  return (
    <CommandCard
      title={t("title")}
      action={<StatusBadge variant="stable">{t("stable")}</StatusBadge>}
    >
      <div className="mb-5 flex items-end gap-2">
        <span className="text-5xl font-bold leading-none tracking-tight text-command-text">
          {riskIndex.value.toFixed(2)}
        </span>
        <span className="mb-1 flex items-center gap-0.5 text-sm text-command-green">
          <TrendingUp className="h-3.5 w-3.5" />
          +{riskIndex.change}%
        </span>
      </div>

      <ul className="space-y-3 border-t border-command-border pt-4">
        {riskIndex.items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-command-text-secondary">
              {t(item.label as "auLogistics" | "suezTransit" | "coldChain")}
            </span>
            {"value" in item && item.value ? (
              <span className="font-medium text-command-teal-bright">
                {item.value}
              </span>
            ) : (
              <StatusBadge
                variant={
                  statusVariant[item.status as keyof typeof statusVariant] ??
                  "default"
                }
              >
                {t(item.status as "optimal" | "delayed")}
              </StatusBadge>
            )}
          </li>
        ))}
      </ul>
    </CommandCard>
  );
}
