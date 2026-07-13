"use client";

import { useTranslations } from "next-intl";
import { HelpCircle } from "lucide-react";

export function PriceGapLegendHelp() {
  const t = useTranslations("productMonitor.opportunity");

  return (
    <span className="group/help relative inline-flex align-middle">
      <HelpCircle
        className="h-3 w-3 cursor-help text-command-text-muted transition-colors group-hover/help:text-command-teal-bright"
        aria-label={t("priceGapLegendTitle")}
      />
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-command-border bg-command-card-elevated p-2.5 text-left normal-case opacity-0 shadow-lg transition-opacity group-hover/help:visible group-hover/help:opacity-100"
      >
        <p className="text-[10px] leading-snug text-command-text-secondary">
          {t("priceGapLegendIntro")}
        </p>
      </div>
    </span>
  );
}
