"use client";

import { useTranslations } from "next-intl";
import { HelpCircle } from "lucide-react";
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
    <span className="group/help relative inline-flex align-middle">
      <HelpCircle
        className="h-3 w-3 cursor-help text-command-text-muted transition-colors group-hover/help:text-command-teal-bright"
        aria-label={t("legendTitle")}
      />
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg border border-command-border bg-command-card-elevated p-2.5 text-left normal-case opacity-0 shadow-lg transition-opacity group-hover/help:visible group-hover/help:opacity-100"
      >
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
      </div>
    </span>
  );
}
