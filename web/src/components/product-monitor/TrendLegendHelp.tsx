"use client";

import { useTranslations } from "next-intl";
import { HeaderHelpTooltip } from "@/components/ui/HeaderHelpTooltip";

export function TrendLegendHelp() {
  const t = useTranslations("productMonitor.opportunity");

  return (
    <HeaderHelpTooltip label={t("trendLegendTitle")}>
      <p className="text-[10px] leading-snug text-command-text-secondary">
        {t("trendLegendIntro")}
      </p>
    </HeaderHelpTooltip>
  );
}
