"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDbResource } from "@/hooks/useDbResource";
import {
  getSignalsBySource,
  getSignalsByDimension,
  countPendingMatrixUpdates,
} from "@/lib/intelligence/seed-data";
import type { IntelSignal, SignalDimension } from "@/lib/intelligence/seed-data";
import { socialPostsHref } from "@/lib/social/post-deep-link";
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
  signals: [] as IntelSignal[],
  skuOpportunities: [],
};

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };

export default function IntelligencePage() {
  const t = useTranslations();
  const { data, loading, usingDb } = useDbResource("/api/intelligence", intelligenceFallback);
  const intelligenceSignals = usingDb ? data.signals : [];

  const [activeFilter, setActiveFilter] = useState<
    SignalDimension | "all" | "pending"
  >("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const availableDates = useMemo(() => {
    const dates = [...new Set(intelligenceSignals.map((s) => s.date))];
    dates.sort((a, b) => b.localeCompare(a));
    return dates;
  }, [intelligenceSignals]);

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDate(null);
      return;
    }
    if (!selectedDate || !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const dateSignals = useMemo(() => {
    if (!selectedDate) return intelligenceSignals;
    return intelligenceSignals.filter((s) => s.date === selectedDate);
  }, [intelligenceSignals, selectedDate]);

  const filteredSignals =
    activeFilter === "all"
      ? dateSignals
      : activeFilter === "pending"
        ? dateSignals.filter((s) => s.pendingMatrixUpdate)
        : getSignalsByDimension(activeFilter, dateSignals);

  const pendingCount = countPendingMatrixUpdates(dateSignals);
  const sources = ["news_legal", "insider", "social", "platform_2c"] as const;

  const dateBounds = useMemo(() => {
    if (availableDates.length === 0) return { min: "", max: "" };
    return {
      min: availableDates[availableDates.length - 1],
      max: availableDates[0],
    };
  }, [availableDates]);

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <div className="space-y-6">
        <CommandCard>
          <div className="mb-5 space-y-3">
            {availableDates.length > 0 && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <label
                  htmlFor="intel-date"
                  className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted"
                >
                  {t("intelligencePage.dateLabel")}
                </label>
                <input
                  id="intel-date"
                  type="date"
                  value={selectedDate ?? ""}
                  min={dateBounds.min}
                  max={dateBounds.max}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className={cn(
                    "rounded-lg border border-command-border bg-command-card-elevated px-3 py-1.5",
                    "text-sm text-command-text",
                    "[color-scheme:dark]",
                    "focus:border-command-teal/40 focus:outline-none focus:ring-1 focus:ring-command-teal/30",
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sources.map((src) => {
                const signals = getSignalsBySource(src, dateSignals);
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
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BriefKpi label={t("intelligencePage.signalCount")} value={String(dateSignals.length)} />
            <BriefKpi label={t("intelligencePage.pendingMatrix")} value={String(pendingCount)} accent={pendingCount > 0} />
            <BriefKpi
              label={t("intelligencePage.dimensions.regulatory")}
              value={String(getSignalsByDimension("regulatory", dateSignals).length)}
            />
            <BriefKpi
              label={t("intelligencePage.dimensions.demand")}
              value={String(getSignalsByDimension("demand", dateSignals).length)}
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
            {loading && (
              <p className="py-8 text-center text-sm text-command-text-muted">
                {t("intelligencePage.loading")}
              </p>
            )}
            {!loading &&
              filteredSignals.length === 0 && (
                <p className="py-8 text-center text-sm text-command-text-muted">
                  {selectedDate && dateSignals.length === 0
                    ? t("intelligencePage.noSignalsOnDate")
                    : t("intelligencePage.summaryEmpty")}
                </p>
              )}
            {!loading &&
              filteredSignals.map((signal) => {
              const cfg = sourceConfig[signal.source];
              const Icon = cfg.icon;
              const dim = dimensionStyles[signal.dimension];
              const TrendIcon = signal.trend ? trendIcon[signal.trend] : Minus;
              const sourcePostHref =
                signal.source === "social"
                  ? socialPostsHref({ postUrl: signal.url })
                  : null;

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
                        <span
                          title={t("intelligencePage.heatTooltip")}
                          className={cn(
                            "cursor-help",
                            signal.heatImpact >= 0 ? "text-command-green" : "text-command-red",
                          )}
                        >
                          {t("intelligencePage.heat")} {signal.heatImpact > 0 ? "+" : ""}
                          {signal.heatImpact}
                        </span>
                      )}
                      {sourcePostHref && (
                        <Link
                          href={sourcePostHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded border border-command-teal/40 bg-command-teal/10 px-2 py-1 text-[10px] font-medium text-command-teal-bright transition-colors hover:bg-command-teal/20"
                        >
                          {t("intelligencePage.viewSourcePost")}
                        </Link>
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
