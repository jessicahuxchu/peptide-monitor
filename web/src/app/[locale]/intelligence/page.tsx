"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { SourcePreviewPanel } from "@/components/intelligence/SourcePreviewPanel";
import { useDbResource } from "@/hooks/useDbResource";
import {
  getSignalsBySource,
  getSignalsByDimension,
} from "@/lib/intelligence/seed-data";
import type { IntelSignal, SignalDimension } from "@/lib/intelligence/seed-data";
import { normalizeRedditUrl } from "@/lib/social/post-deep-link";
import type { SocialPost } from "@/lib/social/types";
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

function matchPostByUrl(posts: SocialPost[], url: string): SocialPost | null {
  const norm = normalizeRedditUrl(url);
  return (
    posts.find(
      (p) =>
        normalizeRedditUrl(p.url) === norm ||
        normalizeRedditUrl(p.permalink) === norm,
    ) ?? null
  );
}

/** Volume digests only store one representative URL — expand to related articles. */
function relatedPostsForVolumeDigest(
  posts: SocialPost[],
  signal: IntelSignal,
): SocialPost[] {
  if (!signal.id.startsWith("news-legal-vol-")) return [];
  const product = signal.products[0];
  if (!product) return [];

  const end = new Date(`${signal.date}T23:59:59.999Z`).getTime();
  const start = end - 7 * 24 * 60 * 60 * 1000;

  return posts
    .filter((p) => {
      if (p.platform !== "google_news") return false;
      if (!p.products.includes(product)) return false;
      const t = new Date(p.postedAt).getTime();
      if (Number.isNaN(t)) return false;
      return t >= start && t <= end;
    })
    .sort(
      (a, b) =>
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
    );
}

export default function IntelligencePage() {
  const t = useTranslations();
  const { data, loading, usingDb } = useDbResource("/api/intelligence", intelligenceFallback);
  const intelligenceSignals = usingDb ? data.signals : [];

  const [activeFilter, setActiveFilter] = useState<SignalDimension | "all">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [previewSignal, setPreviewSignal] = useState<IntelSignal | null>(null);
  const [postCache, setPostCache] = useState<SocialPost[] | null>(null);
  const [postLoading, setPostLoading] = useState(false);

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

  useEffect(() => {
    if (!previewSignal?.url || postCache) return;

    let cancelled = false;
    setPostLoading(true);
    fetch("/api/social-posts?limit=300")
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<{ posts: SocialPost[] }>;
      })
      .then((json) => {
        if (!cancelled) setPostCache(json.posts ?? []);
      })
      .catch(() => {
        if (!cancelled) setPostCache([]);
      })
      .finally(() => {
        if (!cancelled) setPostLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [previewSignal, postCache]);

  // Keep drawer selection inside the currently selected day.
  useEffect(() => {
    if (!previewSignal || !selectedDate) return;
    if (previewSignal.date === selectedDate) return;
    const next = dateSignals[0] ?? null;
    setPreviewSignal(next);
  }, [selectedDate, dateSignals, previewSignal]);

  const previewPost = useMemo(() => {
    if (!previewSignal?.url || !postCache) return null;
    return matchPostByUrl(postCache, previewSignal.url);
  }, [previewSignal, postCache]);

  const previewRelatedPosts = useMemo(() => {
    if (!previewSignal || !postCache) return [];
    return relatedPostsForVolumeDigest(postCache, previewSignal);
  }, [previewSignal, postCache]);

  const filteredSignals =
    activeFilter === "all"
      ? dateSignals
      : getSignalsByDimension(activeFilter, dateSignals);

  const regulatoryRumorCount = getSignalsByDimension("regulatory", dateSignals).length;
  const sources = ["news_legal", "insider", "social", "platform_2c"] as const;

  const dateBounds = useMemo(() => {
    if (availableDates.length === 0) return { min: "", max: "" };
    return {
      min: availableDates[availableDates.length - 1],
      max: availableDates[0],
    };
  }, [availableDates]);

  const panelOpen = previewSignal !== null;

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <div
        className={cn(
          "gap-4",
          panelOpen ? "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : "block",
        )}
      >
        <div className="min-w-0 space-y-6">
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
              <BriefKpi
                label={t("intelligencePage.regulatoryRumor")}
                value={String(regulatoryRumorCount)}
                accent={regulatoryRumorCount > 0}
              />
              <BriefKpi
                label={t("intelligencePage.dimensions.demand")}
                value={String(getSignalsByDimension("demand", dateSignals).length)}
              />
              <BriefKpi
                label={t("intelligencePage.dimensions.competitive")}
                value={String(getSignalsByDimension("competitive", dateSignals).length)}
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <FilterTab active={activeFilter === "all"} onClick={() => setActiveFilter("all")} label={t("intelligencePage.allSources")} />
              {(["demand", "regulatory", "competitive"] as SignalDimension[]).map((dim) => (
                <FilterTab
                  key={dim}
                  active={activeFilter === dim}
                  onClick={() => setActiveFilter(dim)}
                  label={
                    dim === "regulatory"
                      ? `${t("intelligencePage.dimensions.regulatory")} (${regulatoryRumorCount})`
                      : t(`intelligencePage.dimensions.${dim}`)
                  }
                />
              ))}
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
                const isRegulatory = signal.dimension === "regulatory";
                const isRegulatoryRumor =
                  isRegulatory && signal.source === "social";
                const canPreview = Boolean(signal.url);
                const isActive = previewSignal?.id === signal.id;
                const previewLabel =
                  signal.source === "social"
                    ? t("intelligencePage.viewSourcePost")
                    : t("intelligencePage.viewSourceArticle");

                return (
                  <article
                    key={signal.id}
                    className={cn(
                      "rounded-xl border p-3 transition-colors hover:bg-command-card-elevated/50",
                      isActive
                        ? "border-command-teal/50 bg-command-teal/5 ring-1 ring-command-teal/25"
                        : isRegulatory
                          ? "border-command-orange/50 bg-command-orange/5 ring-1 ring-command-orange/20"
                          : cfg.border,
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <Icon className={cn("h-3.5 w-3.5", isRegulatory ? "text-command-orange" : cfg.color)} />
                          <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", dim.border)}>
                            {t(`intelligencePage.dimensions.${dim.label}`)}
                          </span>
                          {isRegulatoryRumor && (
                            <span className="rounded border border-command-orange/40 bg-command-orange/10 px-1.5 py-0.5 text-[9px] font-medium text-command-orange">
                              {t("intelligencePage.rumorBadge")}
                            </span>
                          )}
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
                        {isRegulatory && signal.regulatoryImpact !== undefined && (
                          <span
                            title={t("intelligencePage.rumorIntensityTooltip")}
                            className="cursor-help rounded border border-command-orange/30 bg-command-orange/5 px-2 py-0.5 text-command-orange"
                          >
                            {t("intelligencePage.rumorIntensity")}{" "}
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
                        {canPreview && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewSignal((current) =>
                                current?.id === signal.id ? null : signal,
                              )
                            }
                            className={cn(
                              "rounded border px-2 py-1 text-[10px] font-medium transition-colors",
                              isActive
                                ? "border-command-teal/60 bg-command-teal/20 text-command-teal-bright"
                                : "border-command-teal/40 bg-command-teal/10 text-command-teal-bright hover:bg-command-teal/20",
                            )}
                          >
                            {previewLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </CommandCard>
        </div>

        {panelOpen && previewSignal && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setPreviewSignal(null)}
              aria-hidden
            />
            <div
              className={cn(
                "z-50 min-h-0",
                "fixed inset-y-0 right-0 w-[min(100%,22rem)] p-3 lg:static lg:w-auto lg:p-0",
              )}
            >
              <SourcePreviewPanel
                signals={dateSignals}
                signal={previewSignal}
                post={previewPost}
                relatedPosts={previewRelatedPosts}
                loading={postLoading && !postCache}
                dateLabel={selectedDate}
                onSelect={setPreviewSignal}
                onClose={() => setPreviewSignal(null)}
              />
            </div>
          </>
        )}
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
