"use client";

import { useTranslations } from "next-intl";
import { HeaderHelpTooltip } from "@/components/ui/HeaderHelpTooltip";

export function ViabilityLegendHelp() {
  const t = useTranslations("productMonitor.viability");

  return (
    <HeaderHelpTooltip label={t("scoreLegendTitle")} panelClassName="w-60">
      <p className="text-[10px] leading-snug text-command-text-secondary">
        {t("scoreLegendIntro")}
      </p>
    </HeaderHelpTooltip>
  );
}
