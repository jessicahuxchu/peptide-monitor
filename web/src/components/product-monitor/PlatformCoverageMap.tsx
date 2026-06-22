"use client";

import { useTranslations } from "next-intl";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import type { ProductMonitorRecord } from "@/lib/product-monitor/types";
import { cn } from "@/lib/utils";

const levelColor: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-command-border/40",
  1: "bg-command-teal/30",
  2: "bg-command-teal/60",
  3: "bg-command-teal-bright/80",
};

interface PlatformCoverageMapProps {
  record: ProductMonitorRecord;
}

export function PlatformCoverageMap({ record }: PlatformCoverageMapProps) {
  const t = useTranslations("productMonitor.coverage");
  const { data } = useProductMonitor();
  const platforms = data.platforms;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-command-text-secondary">
          {record.platformCoverage}/{record.platformTotal} {t("platformsListed")}
        </span>
        <span className="font-semibold text-command-teal-bright">
          {Math.round((record.platformCoverage / record.platformTotal) * 100)}%
        </span>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {platforms.map((plat) => {
          const level = record.platformPresence[plat.id];
          const listing = record.platformListings[plat.id];

          return (
            <div
              key={plat.id}
              className={cn(
                "rounded-lg border border-command-border/60 p-2.5",
                level > 0 && "border-command-teal/20 bg-command-teal/5",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-medium text-command-text">
                  {plat.name}
                </span>
                <span
                  className={cn("h-2 w-8 shrink-0 rounded-full", levelColor[level])}
                  title={t(`level.${level}`)}
                />
              </div>
              {listing && (
                <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-command-text-muted">
                  {listing}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-command-text-muted">
        {[0, 1, 2, 3].map((lvl) => (
          <span key={lvl} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2 w-4 rounded-full", levelColor[lvl as 0 | 1 | 2 | 3])} />
            {t(`level.${lvl}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
