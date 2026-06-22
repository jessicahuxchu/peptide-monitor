"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { Sparkline } from "@/components/ui/Sparkline";
import { useDbResource } from "@/hooks/useDbResource";
import { skuOpportunities as fallbackSku } from "@/lib/supply-chain/seed-data";
import {
  intelligenceSignals as fallbackSignals,
  getSignalsBySource,
  calcAggregateImpact,
} from "@/lib/intelligence/seed-data";
import { TrendingDown, TrendingUp, Minus, Newspaper, Users, MessageCircle, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const sourceConfig = {
  news_legal: { icon: Newspaper, color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5" },
  insider: { icon: Users, color: "text-command-teal-bright", border: "border-command-teal/30", bg: "bg-command-teal/5" },
  social: { icon: MessageCircle, color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/5" },
  platform_2c: { icon: ShoppingBag, color: "text-command-orange", border: "border-command-orange/30", bg: "bg-command-orange/5" },
} as const;

const intelligenceFallback = {
  signals: fallbackSignals,
  skuOpportunities: fallbackSku,
};

export default function IntelligencePage() {
  const t = useTranslations();
  const { data } = useDbResource("/api/intelligence", intelligenceFallback);
  const { signals: intelligenceSignals, skuOpportunities } = data;
  const [activeSource, setActiveSource] = useState<keyof typeof sourceConfig | "all">("all");

  const sorted = [...skuOpportunities].sort((a, b) => b.opportunityScore - a.opportunityScore);
  const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
  const topSku = sorted[0];
  const avgOpportunity = Math.round(
    sorted.reduce((s, sku) => s + sku.opportunityScore, 0) / sorted.length,
  );

  const filteredSignals =
    activeSource === "all"
      ? intelligenceSignals
      : getSignalsBySource(activeSource);

  const sources = ["news_legal", "insider", "social", "platform_2c"] as const;

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <div className="space-y-6">
        {/* Key metrics + SKU ranking */}
        <CommandCard title={t("intelligencePage.skuRanking")} subtitle={t("pages.intelligence.description")}>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiBox label={t("intelligencePage.topOpportunity")} value={topSku?.product ?? "—"} accent />
            <KpiBox label={t("intelligencePage.opportunity")} value={String(topSku?.opportunityScore ?? "—")} />
            <KpiBox label={t("intelligencePage.avgOpportunity")} value={String(avgOpportunity)} />
            <KpiBox label={t("intelligencePage.signalCount")} value={String(intelligenceSignals.length)} />
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-command-border text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">{t("intelligencePage.product")}</th>
                  <th className="pb-3 pr-4">{t("intelligencePage.opportunity")}</th>
                  <th className="pb-3 pr-4">{t("intelligencePage.demand")}</th>
                  <th className="pb-3 pr-4">{t("intelligencePage.localPrice")}</th>
                  <th className="pb-3 pr-4">{t("intelligencePage.competitive")}</th>
                  <th className="pb-3 pr-4">{t("intelligencePage.sensitivity")}</th>
                  <th className="pb-3">{t("intelligencePage.trend")}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((sku, index) => {
                  const TrendIcon = trendIcon[sku.trend];
                  return (
                    <tr
                      key={sku.id}
                      className="border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/50"
                    >
                      <td className="py-3 pr-4 text-command-text-muted">{index + 1}</td>
                      <td className="py-3 pr-4 font-semibold text-command-teal-bright">{sku.product}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            sku.opportunityScore >= 60 ? "text-command-green" : sku.opportunityScore >= 40 ? "text-command-orange" : "text-command-text-secondary",
                          )}
                        >
                          {sku.opportunityScore}
                        </span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{sku.demandScore}</td>
                      <td className="py-3 pr-4 tabular-nums">${sku.localPrice}</td>
                      <td className="py-3 pr-4 tabular-nums text-command-text-secondary">${sku.competitivePrice}</td>
                      <td className="py-3 pr-4 tabular-nums">{(sku.regulatorySensitivity * 100).toFixed(0)}%</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <TrendIcon
                            className={cn(
                              "h-3.5 w-3.5",
                              sku.trend === "up" && "text-command-green",
                              sku.trend === "down" && "text-command-red",
                              sku.trend === "stable" && "text-command-text-muted",
                            )}
                          />
                          <Sparkline data={sku.sparkline} width={64} height={20} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CommandCard>

        {/* Market intelligence feed */}
        <CommandCard title={t("pages.intelligence.title")}>
          <div className="mb-4 flex flex-wrap gap-2">
            <SourceTab
              active={activeSource === "all"}
              onClick={() => setActiveSource("all")}
              label={t("intelligencePage.allSources")}
            />
            {sources.map((src) => {
              const cfg = sourceConfig[src];
              const Icon = cfg.icon;
              const impact = calcAggregateImpact(getSignalsBySource(src));
              return (
                <SourceTab
                  key={src}
                  active={activeSource === src}
                  onClick={() => setActiveSource(src)}
                  label={
                    <span className="flex items-center gap-1.5">
                      <Icon className={cn("h-3 w-3", cfg.color)} />
                      {t(`intelligencePage.sources.${src}`)}
                    </span>
                  }
                  badge={`${impact.heat > 0 ? "+" : ""}${impact.heat}°`}
                />
              );
            })}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sources.map((src) => {
              const signals = getSignalsBySource(src);
              const impact = calcAggregateImpact(signals);
              const cfg = sourceConfig[src];
              const Icon = cfg.icon;
              return (
                <div key={src} className={cn("rounded-xl border p-3", cfg.border, cfg.bg)}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
                      {t(`intelligencePage.sources.${src}`)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs">
                    <span className="text-command-teal-bright">
                      {t("intelligencePage.heat")}: {impact.heat > 0 ? "+" : ""}{impact.heat}
                    </span>
                    <span className="text-command-orange">
                      {t("intelligencePage.regulatory")}: {impact.regulatory > 0 ? "+" : ""}{impact.regulatory}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {filteredSignals.map((signal) => {
              const cfg = sourceConfig[signal.source];
              const Icon = cfg.icon;
              const TrendIcon = signal.trend ? trendIcon[signal.trend] : Minus;
              return (
                <article
                  key={signal.id}
                  className={cn(
                    "rounded-xl border p-3 transition-colors hover:bg-command-card-elevated/50",
                    cfg.border,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                        <span className="text-[10px] text-command-text-muted">{signal.date}</span>
                        {signal.region && (
                          <span className="text-[10px] text-command-text-muted">· {signal.region}</span>
                        )}
                        {signal.trend && (
                          <TrendIcon
                            className={cn(
                              "h-3 w-3",
                              signal.trend === "up" && "text-command-green",
                              signal.trend === "down" && "text-command-red",
                              signal.trend === "stable" && "text-command-text-muted",
                            )}
                          />
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-command-text">{signal.title}</h4>
                      <p className="mt-1 text-xs text-command-text-secondary">{signal.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {signal.products.map((p) => (
                          <span
                            key={p}
                            className="rounded border border-command-border px-1.5 py-0.5 text-[10px] text-command-teal-bright"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-[10px] tabular-nums">
                      {signal.heatImpact !== undefined && (
                        <span className={cn(signal.heatImpact >= 0 ? "text-command-green" : "text-command-red")}>
                          {t("intelligencePage.heat")} {signal.heatImpact > 0 ? "+" : ""}{signal.heatImpact}
                        </span>
                      )}
                      {signal.regulatoryImpact !== undefined && (
                        <span className={cn(signal.regulatoryImpact >= 0 ? "text-command-orange" : "text-command-green")}>
                          {t("intelligencePage.regulatory")} {signal.regulatoryImpact > 0 ? "+" : ""}{signal.regulatoryImpact}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </CommandCard>
      </div>
    </div>
  );
}

function KpiBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-command-border bg-command-card-elevated p-3">
      <p className="text-[10px] text-command-text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-bold tabular-nums",
          accent ? "text-command-teal-bright" : "text-command-text",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SourceTab({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: ReactNode;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
        active
          ? "border-command-teal/40 bg-command-teal/10 text-command-teal-bright"
          : "border-command-border text-command-text-muted hover:text-command-text-secondary",
      )}
    >
      {label}
      {badge && <span className="text-[9px] opacity-70">{badge}</span>}
    </button>
  );
}
