"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TierBadge } from "@/components/product-monitor/TierBadge";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import { cn } from "@/lib/utils";

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

interface StrategySummaryProps {
  core: { product: string; primarySpec: string }[];
  trial: { product: string; primarySpec: string }[];
  avoid: { product: string; primarySpec: string }[];
  budgets: { core: string; trial: string; avoid: string };
}

export function StrategySummary({ core, trial, avoid, budgets }: StrategySummaryProps) {
  const t = useTranslations("productMonitor.strategy");
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-command-border/80 bg-command-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-command-card-elevated/30"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-command-text-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 text-command-text-muted" />
        )}
        <span className="text-sm font-medium text-command-text">{t("title")}</span>
        <span className="text-xs text-command-text-muted">
          {core.length} / {trial.length} / {avoid.length}
        </span>
      </button>

      {open && (
        <div className="grid gap-3 border-t border-command-border px-4 pb-4 pt-3 md:grid-cols-3">
          <StrategyCol tier="core" title={t("coreTitle")} budget={budgets.core} items={core} />
          <StrategyCol tier="trial" title={t("trialTitle")} budget={budgets.trial} items={trial} />
          <StrategyCol tier="avoid" title={t("avoidTitle")} budget={budgets.avoid} items={avoid} />
        </div>
      )}
    </section>
  );
}

function StrategyCol({
  tier,
  title,
  budget,
  items,
}: {
  tier: "core" | "trial" | "avoid";
  title: string;
  budget: string;
  items: { product: string; primarySpec: string }[];
}) {
  const border = {
    core: "border-command-teal/20",
    trial: "border-command-orange/20",
    avoid: "border-command-red/20",
  }[tier];

  return (
    <div className={cn("rounded-lg border p-3", border)}>
      <h4 className="text-xs font-semibold text-command-text">{title}</h4>
      <p className="mt-1 text-[10px] leading-relaxed text-command-text-muted">{budget}</p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.product} className="text-[11px]">
            <span className="font-medium text-command-text">{item.product}</span>
            <span className="text-command-text-muted"> · {item.primarySpec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
