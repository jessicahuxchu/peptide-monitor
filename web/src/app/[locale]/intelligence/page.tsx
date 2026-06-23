"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDbResource } from "@/hooks/useDbResource";
import {
  intelligenceSignals as fallbackSignals,
  getSignalsBySource,
  getSignalsByDimension,
  countPendingMatrixUpdates,
} from "@/lib/intelligence/seed-data";
import type { SignalDimension } from "@/lib/intelligence/seed-data";
import { Link } from "@/i18n/navigation";
import {
  Newspaper,
  Users,
  MessageCircle,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const sourceConfig = {
  news_legal: { icon: Newspaper, color: "text-blue-400", border: "border-blue-500/30" },
  insider: { icon: Users, color: "text-command-teal-bright", border: "border-command-teal/30" },
  social: { icon: MessageCircle, color: "text-purple-400", border: "border-purple-500/30" },
  platform_2c: { icon: ShoppingBag, color: "text-command-orange", border: "border-command-orange/30" },
} as const;

const dimensionStyles: Record<
  SignalDimension,
  { border: string; label: string }
> = {
  demand: { border: "border-command-teal/30", label: "demand" },
  regulatory: { border: "border-command-orange/30", label: "regulatory" },
  competitive: { border: "border-purple-500/30", label: "competitive" },
};

const intelligenceFallback = {
  signals: fallbackSignals,
  skuOpportunities: [],
};

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };

export default function IntelligencePage() {
  const t = useTranslations();
  const { data } = useDbResource("/api/intelligence", intelligenceFallback);
  const { signals: intelligenceSignals } = data;

  const [activeFilter, setActiveFilter] = useState<
    SignalDimension | "all" | "pending"
  >("all");

  const filteredSignals =
    activeFilter === "all"
      ? intelligenceSignals
      : activeFilter === "pending"
        ? intelligenceSignals.filter((s) => s.pendingMatrixUpdate)
        : getSignalsByDimension(activeFilter, intelligenceSignals);

  const pendingCount = countPendingMatrixUpdates(intelligenceSignals);
  const sources = ["news_legal", "insider", "social", "platform_2c"] as const;

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <div className="space-y-6">
        <CommandCard
          title={t("pages.intelligence.title")}
          subtitle={t("pages.intelligence.description")}
        >
          <p className="mb-4 text-xs leading-relaxed text-command-text-muted">
            {t("intelligencePage.layerHint")}
          </p>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BriefKpi label={t("intelligencePage.signalCount")} value={String(intelligenceSignals.length)} />
            <BriefKpi label={t("intelligencePage.pendingMatrix")} value={String(pendingCount)} accent={pendingCount > 0} />
            <BriefKpi
              label={t("intelligencePage.dimensions.regulatory")}
              value={String(getSignalsByDimension("regulatory", intelligenceSignals).length)}
            />
            <BriefKpi
              label={t("intelligencePage.dimensions.demand")}
              value={String(getSignalsByDimension("demand", intelligenceSignals).length)}
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <FilterTab active={activeFilter === "all"} onClick={() => setActiveFilter("all")} label={t("intelligencePage.allSources")} />
            {(["demand", "regulatory", "competitive"] as SignalDimension[]).map((dim) => (
              <FilterTab
                key={dim}
                active={activeFilter === dim}
                onClick={() => setActiveFilter(dim)}
                label={t(`intelligencePage.dimensions.${dim}`)}
              />
            ))}
            {pendingCount > 0 && (
              <FilterTab
                active={activeFilter === "pending"}
                onClick={() => setActiveFilter("pending")}
                label={`${t("intelligencePage.pendingMatrix")} (${pendingCount})`}
              />
            )}
          </div>

          <div className="space-y-2">
            {filteredSignals.map((signal) => {
              const cfg = sourceConfig[signal.source];
              const Icon = cfg.icon;
              const dim = dimensionStyles[signal.dimension];
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
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                        <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", dim.border)}>
                          {t(`intelligencePage.dimensions.${dim.label}`)}
                        </span>
                        <span className="text-[10px] text-command-text-muted">{signal.date}</span>
                        {signal.region && (
                          <span className="text-[10px] text-command-text-muted">· {signal.region}</span>
                        )}
                        {signal.trend && (
                          <TrendIcon className="h-3 w-3 text-command-text-muted" />
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

                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-command-text-muted">
                        <span>{signal.directionLabel}</span>
                        <span>· {t(`intelligencePage.credibility.${signal.credibility}`)}</span>
                        <span>· {t(`intelligencePage.horizon.${signal.horizon}`)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5 text-[10px]">
                      {signal.dimension === "regulatory" && signal.regulatoryImpact !== undefined && (
                        <span className="rounded border border-command-orange/30 bg-command-orange/5 px-2 py-0.5 text-command-orange">
                          {t("intelligencePage.matrixDelta")}{" "}
                          {signal.regulatoryImpact > 0 ? "+" : ""}
                          {signal.regulatoryImpact}
                        </span>
                      )}
                      {signal.dimension === "demand" && signal.heatImpact !== undefined && (
                        <span className={cn(signal.heatImpact >= 0 ? "text-command-green" : "text-command-red")}>
                          {t("intelligencePage.heat")} {signal.heatImpact > 0 ? "+" : ""}
                          {signal.heatImpact}
                        </span>
                      )}
                      {signal.pendingMatrixUpdate && (
                        <Link
                          href="/regulatory"
                          className="text-command-teal-bright hover:underline"
                        >
                          {t("intelligencePage.confirmToMatrix")}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </CommandCard>

        <CommandCard title={t("intelligencePage.sourceBreakdown")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sources.map((src) => {
              const signals = getSignalsBySource(src, intelligenceSignals);
              const cfg = sourceConfig[src];
              const Icon = cfg.icon;
              return (
                <div key={src} className={cn("rounded-xl border p-3", cfg.border)}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
                      {t(`intelligencePage.sources.${src}`)}
                    </span>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-command-text">
                    {signals.length}
                  </p>
                </div>
              );
            })}
          </div>
        </CommandCard>
      </div>
    </div>
  );
}

function BriefKpi({
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
          accent ? "text-command-orange" : "text-command-text",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
        active
          ? "border-command-teal/40 bg-command-teal/10 text-command-teal-bright"
          : "border-command-border text-command-text-muted hover:text-command-text-secondary",
      )}
    >
      {label}
    </button>
  );
}
