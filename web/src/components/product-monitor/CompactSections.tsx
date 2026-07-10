"use client";

import { useTranslations } from "next-intl";
import { TierBadge } from "@/components/product-monitor/TierBadge";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";

export function BlendStrip() {
  const t = useTranslations("productMonitor");
  const { data } = useProductMonitor();
  const productBlends = data.blends;

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {productBlends.map((blend) => (
        <div
          key={blend.id}
          className="rounded-lg border border-command-border/60 bg-command-card-elevated/20 px-3 py-2.5"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-command-teal-bright">{blend.name}</span>
            <TierBadge tier={blend.tier} />
          </div>
          <p className="line-clamp-1 text-[10px] text-command-text-muted">
            {blend.components.map((c) => `${c.product} ${c.amount}`).join(" · ")}
          </p>
          <p className="mt-1 text-[10px] tabular-nums text-command-text-secondary">
            {blend.platformCoverage}/{blend.platformTotal} {t("blends.platforms")} ·{" "}
            {t(`stockMode.${blend.stockMode}`)}
          </p>
        </div>
      ))}
    </div>
  );
}
