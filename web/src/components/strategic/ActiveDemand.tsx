"use client";

import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { Sparkline } from "@/components/ui/Sparkline";
import { useDashboard } from "@/components/providers/DashboardProvider";
import { activeDemand as fallbackActiveDemand } from "@/lib/mock-data";

export function ActiveDemand() {
  const t = useTranslations("demand");
  const { data } = useDashboard();
  const activeDemand =
    (data.config.active_demand as typeof fallbackActiveDemand | null) ??
    fallbackActiveDemand;

  return (
    <CommandCard
      title={`${t("title")} (${activeDemand.product})`}
      className="flex-1"
    >
      <p className="mb-1 text-3xl font-bold text-command-text">
        {activeDemand.volume}
        <span className="ml-1.5 text-base font-normal text-command-text-secondary">
          {t("unitsPerMonth")}
        </span>
      </p>

      <div className="my-4 h-12 w-full">
        <Sparkline data={activeDemand.sparkline} className="h-full w-full" />
      </div>

      <div className="flex items-baseline justify-between border-t border-command-border pt-3">
        <span className="text-xs text-command-text-muted">{t("currentPrice")}</span>
        <span className="text-sm font-medium text-command-text">
          ${activeDemand.price.toFixed(2)} / {activeDemand.priceUnit}
        </span>
      </div>
    </CommandCard>
  );
}
