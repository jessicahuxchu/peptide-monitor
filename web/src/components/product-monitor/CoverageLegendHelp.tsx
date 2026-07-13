"use client";

import { useTranslations } from "next-intl";
import { HeaderHelpTooltip } from "@/components/ui/HeaderHelpTooltip";
import { cn } from "@/lib/utils";

const levelColor: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-command-border/50",
  1: "bg-command-teal/30",
  2: "bg-command-teal/60",
  3: "bg-command-teal-bright/80",
};

export function CoverageLegendHelp() {
  const t = useTranslations("productMonitor.coverage");

  return (
    <HeaderHelpTooltip label={t("legendTitle")} panelClassName="w-52">
      <p className="mb-2 text-[10px] leading-snug text-command-text-secondary">
        {t("legendIntro")}
      </p>
      <ul className="space-y-1">
        {([0, 1, 2, 3] as const).map((lvl) => (
          <li key={lvl} className="flex items-center gap-2 text-[10px] text-command-text-muted">
            <span className={cn("h-2 w-4 shrink-0 rounded-sm", levelColor[lvl])} />
            {t(`level.${lvl}`)}
          </li>
        ))}
      </ul>
    </HeaderHelpTooltip>
  );
}
