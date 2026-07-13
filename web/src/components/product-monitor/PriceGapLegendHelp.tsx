"use client";

import { useTranslations } from "next-intl";
import { HeaderHelpTooltip } from "@/components/ui/HeaderHelpTooltip";

export function PriceGapLegendHelp() {
  const t = useTranslations("productMonitor.opportunity");

  return (
    <HeaderHelpTooltip label={t("priceGapLegendTitle")}>
      <p className="text-[10px] leading-snug text-command-text-secondary">
        {t("priceGapLegendIntro")}
      </p>
    </HeaderHelpTooltip>
  );
}
