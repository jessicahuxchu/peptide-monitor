"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SourcePreviewPanel } from "@/components/intelligence/SourcePreviewPanel";
import { useDbResource } from "@/hooks/useDbResource";
import {
  filterSignalsByWindow,
  type IntelDateMode,
} from "@/lib/intelligence/signal-window";
import {
  getSignalsByKind,
  getSignalsBySource,
} from "@/lib/intelligence/seed-data";
import type { IntelSignal, SignalKind } from "@/lib/intelligence/seed-data";
import { normalizeRedditUrl } from "@/lib/social/post-deep-link";
import {
  newsGroupKeyFromSignal,
  postsForNewsGroup,
} from "@/lib/social/news-group-key";
import { newsLookbackWindowEnding } from "@/lib/social/news-window";
import type { NormalizedSocialPost, SocialPost } from "@/lib/social/types";
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

const kindStyles: Record<SignalKind, { border: string; label: string }> = {
  product_heat: { border: "border-command-teal/30", label: "productHeat" },
  regulatory_alert: { border: "border-command-orange/30", label: "regulatoryAlert" },
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

function socialPostToNormalized(post: SocialPost): NormalizedSocialPost {
  return {
    id: post.id,
    platform: post.platform === "google_news" ? "google_news" : "reddit",
    externalId: post.externalId,
    subreddit: post.subreddit ?? "",
    title: post.title,
    body: post.body,
    score: post.score,
    numComments: post.numComments,
    author: post.author,
    permalink: post.permalink,
    url: post.url,
    postedAt: post.postedAt,
    products: post.products,
    hasRegulatory: post.hasRegulatory,
    engagement: post.engagement,
    auContext: post.auContext ?? false,
    regulatoryReason: post.regulatoryReason,
    classifiedBy: post.classifiedBy,
  };
}

function relatedPostsForNewsDigest(
  posts: SocialPost[],
  signal: IntelSignal,
): SocialPost[] {
  const isDigest =
    signal.id.startsWith("news-digest-") ||
    signal.id.startsWith("news-legal-vol-");
  if (!isDigest) return [];

  const group = newsGroupKeyFromSignal(signal);
  if (!group) return [];

  const window = newsLookbackWindowEnding(signal.date, 7);
  const normalized = posts
    .filter((p) => p.platform === "google_news")
    .map(socialPostToNormalized);

  let related = postsForNewsGroup(normalized, group, window ?? undefined);

  // Legacy per-product volume digest
  if (related.length === 0 && signal.id.startsWith("news-legal-vol-")) {
    const product = signal.products[0];
    if (product) {
      related = normalized.filter((p) => {
        if (!p.products.includes(product)) return false;
        if (!window) return true;
        const t = new Date(p.postedAt).getTime();
        return t >= window.startMs && t <= window.endMs;
      });
    }
  }

  const ids = new Set(related.map((p) => p.id));
  return posts.filter((p) => ids.has(p.id));
}

export default function IntelligencePage() {
  const t = useTranslations();
  const { data, loading, usingDb } = useDbResource("/api/intelligence", intelligenceFallback);
  const intelligenceSignals = usingDb ? data.signals : [];

  const [activeFilter, setActiveFilter] = useState<SignalKind | "all">("all");
  const [dateMode, setDateMode] = useState<IntelDateMode>("last7");
  const [anchorDate, setAnchorDate] = useState<string | null>(null);
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
      setAnchorDate(null);
      return;
    }
    if (!anchorDate || !availableDates.includes(anchorDate)) {
      setAnchorDate(availableDates[0]);
    }
  }, [availableDates, anchorDate]);

  const windowSignals = useMemo(() => {
    if (!anchorDate) return intelligenceSignals;
    return filterSignalsByWindow(intelligenceSignals, dateMode, anchorDate, 7);
  }, [intelligenceSignals, dateMode, anchorDate]);

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

  useEffect(() => {
    if (!previewSignal || !anchorDate) return;
    const stillVisible = windowSignals.some((s) => s.id === previewSignal.id);
    if (stillVisible) return;
    setPreviewSignal(windowSignals[0] ?? null);
  }, [anchorDate, dateMode, windowSignals, previewSignal]);

  const previewPost = useMemo(() => {
    if (!previewSignal?.url || !postCache) return null;
    return matchPostByUrl(postCache, previewSignal.url);
  }, [previewSignal, postCache]);

  const previewRelatedPosts = useMemo(() => {
    if (!previewSignal || !postCache) return [];
    return relatedPostsForNewsDigest(postCache, previewSignal);
  }, [previewSignal, postCache]);

  const filteredSignals =
    activeFilter === "all"
      ? windowSignals
      : getSignalsByKind(activeFilter, windowSignals);

  const regulatoryAlertCount = getSignalsByKind(
    "regulatory_alert",
    windowSignals,
  ).length;
  const productHeatCount = getSignalsByKind("product_heat", windowSignals).length;
  const sources = ["news_legal", "insider", "social", "platform_2c"] as const;

  const dateBounds = useMemo(() => {
    if (availableDates.length === 0) return { min: "", max: "" };
    return {
      min: availableDates[availableDates.length - 1],
      max: availableDates[0],
    };
  }, [availableDates]);

  const panelOpen = previewSignal !== null;
  const alignHeaderClass = "flex h-14 shrink-0 items-center";
  const windowLabel =
    dateMode === "last7"
      ? t("intelligencePage.windowLast7")
      : anchorDate ?? "";

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <div
        className={cn(
          "gap-4",
          panelOpen ? "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start" : "block",
        )}
      >
        <div className="min-w-0 space-y-4">
          {availableDates.length > 0 && (
            <div
              className={cn(
                alignHeaderClass,
                "justify-end gap-2",
                panelOpen && "lg:px-1",
              )}
            >
              <div className="flex items-center gap-1 rounded-lg border border-command-border bg-command-card-elevated p-0.5">
                <button
                  type="button"
                  onClick={() => setDateMode("last7")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    dateMode === "last7"
                      ? "bg-command-teal/15 text-command-teal-bright"
                      : "text-command-text-muted hover:text-command-text-secondary",
                  )}
                >
                  {t("intelligencePage.windowLast7")}
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode("day")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    dateMode === "day"
                      ? "bg-command-teal/15 text-command-teal-bright"
                      : "text-command-text-muted hover:text-command-text-secondary",
                  )}
                >
                  {t("intelligencePage.windowSingleDay")}
                </button>
              </div>
              {dateMode === "day" && (
                <>
                  <label
                    htmlFor="intel-date"
                    className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted"
                  >
                    {t("intelligencePage.dateLabel")}
                  </label>
                  <input
                    id="intel-date"
                    type="date"
                    value={anchorDate ?? ""}
                    min={dateBounds.min}
                    max={dateBounds.max}
                    onChange={(e) => {
                      if (e.target.value) setAnchorDate(e.target.value);
                    }}
                    className={cn(
                      "rounded-lg border border-command-border bg-command-card-elevated px-3 py-1.5",
                      "text-sm text-command-text",
                      "[color-scheme:dark]",
                      "focus:border-command-teal/40 focus:outline-none focus:ring-1 focus:ring-command-teal/30",
                    )}
                  />
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sources.map((src) => {
              const signals = getSignalsBySource(src, windowSignals);
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <BriefKpi label={t("intelligencePage.signalCount")} value={String(windowSignals.length)} />
            <BriefKpi
              label={t("intelligencePage.kinds.productHeat")}
              value={String(productHeatCount)}
            />
            <BriefKpi
              label={t("intelligencePage.kinds.regulatoryAlert")}
              value={String(regulatoryAlertCount)}
              accent={regulatoryAlertCount > 0}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterTab active={activeFilter === "all"} onClick={() => setActiveFilter("all")} label={t("intelligencePage.allSources")} />
            <FilterTab
              active={activeFilter === "product_heat"}
              onClick={() => setActiveFilter("product_heat")}
              label={t("intelligencePage.kinds.productHeat")}
            />
            <FilterTab
              active={activeFilter === "regulatory_alert"}
              onClick={() => setActiveFilter("regulatory_alert")}
              label={`${t("intelligencePage.kinds.regulatoryAlert")} (${regulatoryAlertCount})`}
            />
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
                  {anchorDate && windowSignals.length === 0
                    ? t("intelligencePage.noSignalsOnDate")
                    : t("intelligencePage.summaryEmpty")}
                </p>
              )}
            {!loading &&
              filteredSignals.map((signal) => {
              const cfg = sourceConfig[signal.source];
              const Icon = cfg.icon;
              const kindStyle = kindStyles[signal.kind];
              const TrendIcon = signal.trend ? trendIcon[signal.trend] : Minus;
              const isRegulatoryAlert = signal.kind === "regulatory_alert";
              const isRegulatoryRumor =
                isRegulatoryAlert && signal.source === "social";
              const isNewsDigest =
                signal.id.startsWith("news-digest-") ||
                signal.id.startsWith("news-legal-vol-");
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
                      : isRegulatoryAlert
                        ? "border-command-orange/50 bg-command-orange/5 ring-1 ring-command-orange/20"
                        : cfg.border,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Icon className={cn("h-3.5 w-3.5", isRegulatoryAlert ? "text-command-orange" : cfg.color)} />
                        <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", kindStyle.border)}>
                          {t(`intelligencePage.kinds.${kindStyle.label}`)}
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
                      {signal.summary.trim() && !isNewsDigest && (
                        <p className="mt-1 text-xs text-command-text-secondary">
                          {signal.summary}
                        </p>
                      )}

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
                      {isRegulatoryAlert && signal.regulatoryImpact !== undefined && (
                        <span
                          title={t("intelligencePage.rumorIntensityTooltip")}
                          className="cursor-help rounded border border-command-orange/30 bg-command-orange/5 px-2 py-0.5 text-command-orange"
                        >
                          {t("intelligencePage.rumorIntensity")}{" "}
                          {signal.regulatoryImpact > 0 ? "+" : ""}
                          {signal.regulatoryImpact}
                        </span>
                      )}
                      {signal.kind === "product_heat" && signal.heatImpact !== undefined && (
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
                signals={windowSignals}
                signal={previewSignal}
                post={previewPost}
                relatedPosts={previewRelatedPosts}
                loading={postLoading && !postCache}
                dateLabel={windowLabel}
                dateMode={dateMode}
                headerClassName={alignHeaderClass}
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
