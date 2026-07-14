"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ShieldAlert, X } from "lucide-react";
import type { IntelSignal } from "@/lib/intelligence/seed-data";
import type { SocialPost } from "@/lib/social/types";
import { cn, formatDate } from "@/lib/utils";

interface SourcePreviewPanelProps {
  signals: IntelSignal[];
  signal: IntelSignal;
  post: SocialPost | null;
  loading: boolean;
  dateLabel?: string | null;
  onSelect: (signal: IntelSignal) => void;
  onClose: () => void;
}

export function SourcePreviewPanel({
  signals,
  signal,
  post,
  loading,
  dateLabel,
  onSelect,
  onClose,
}: SourcePreviewPanelProps) {
  const t = useTranslations("intelligencePage");
  const locale = useLocale() as "en" | "zh";
  const externalUrl = post?.url ?? signal.url;
  const isNews =
    signal.source === "news_legal" || post?.platform === "google_news";
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [signal.id]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-command-border bg-command-card-elevated",
        "lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]",
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-command-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
            {t("dayDrawerTitle")}
          </p>
          <p className="mt-0.5 text-xs text-command-text-secondary">
            {dateLabel ? `${dateLabel} · ` : ""}
            {t("dayDrawerCount", { count: signals.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-command-text-muted transition-colors hover:bg-command-card hover:text-command-text"
          aria-label={t("previewClose")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Top: scrollable day list */}
      <div className="min-h-0 flex-[2] overflow-y-auto border-b border-command-border">
        {signals.length === 0 ? (
          <p className="px-3 py-4 text-xs text-command-text-muted">
            {t("summaryEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-command-border/60">
            {signals.map((item) => {
              const active = item.id === signal.id;
              const rumored = item.dimension === "regulatory";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    ref={active ? activeItemRef : undefined}
                    onClick={() => onSelect(item)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-command-teal/10"
                        : "hover:bg-command-card",
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded border px-1 py-0.5 text-[9px] font-medium",
                          rumored
                            ? "border-command-orange/40 text-command-orange"
                            : "border-command-border text-command-text-muted",
                        )}
                      >
                        {t(`dimensions.${item.dimension}`)}
                      </span>
                      {rumored && (
                        <span className="text-[9px] text-command-orange">
                          {t("rumorBadge")}
                        </span>
                      )}
                      {item.products[0] && (
                        <span className="truncate text-[9px] text-command-teal-bright">
                          {item.products[0]}
                          {item.products.length > 1
                            ? ` +${item.products.length - 1}`
                            : ""}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "line-clamp-2 text-[11px] leading-snug",
                        active
                          ? "font-medium text-command-text"
                          : "text-command-text-secondary",
                      )}
                    >
                      {item.title}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bottom: source preview */}
      <div className="flex min-h-0 flex-[3] flex-col">
        <div className="shrink-0 border-b border-command-border px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
            {isNews ? t("previewArticle") : t("previewPost")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loading && (
            <p className="text-xs text-command-text-muted">{t("previewLoading")}</p>
          )}

          {!loading && post && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-command-text-muted">
                <span className="rounded border border-command-border px-1.5 py-0.5">
                  {post.platform}
                </span>
                {post.subreddit && <span>r/{post.subreddit}</span>}
                <span>{formatDate(post.postedAt, locale)}</span>
                {(post.score > 0 || post.numComments > 0) && (
                  <span>
                    ↑{post.score} · {post.numComments} comments
                  </span>
                )}
                {post.hasRegulatory && (
                  <span className="inline-flex items-center gap-1 normal-case text-command-orange">
                    <ShieldAlert className="h-3 w-3" />
                    {t("rumorBadge")}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold leading-snug text-command-text">
                {post.title}
              </h3>

              {post.body ? (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-command-text-secondary">
                  {post.body}
                </p>
              ) : (
                <p className="text-xs text-command-text-muted">{t("previewNoBody")}</p>
              )}

              {post.hasRegulatory && post.regulatoryReason && (
                <p className="rounded-lg border border-command-orange/25 bg-command-orange/5 p-2 text-[11px] text-command-orange/90">
                  {post.regulatoryReason}
                </p>
              )}

              {post.products.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.products.map((prod) => (
                    <span
                      key={prod}
                      className="rounded border border-command-teal/30 px-1.5 py-0.5 text-[10px] text-command-teal-bright"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !post && (
            <div className="space-y-3">
              <p className="text-[11px] text-command-text-muted">{t("previewFallback")}</p>
              <h3 className="text-sm font-semibold text-command-text">{signal.title}</h3>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-command-text-secondary">
                {signal.summary}
              </p>
              {signal.products.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {signal.products.map((prod) => (
                    <span
                      key={prod}
                      className="rounded border border-command-teal/30 px-1.5 py-0.5 text-[10px] text-command-teal-bright"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {externalUrl && (
          <div className="shrink-0 border-t border-command-border px-3 py-2.5">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-command-teal-bright hover:underline"
            >
              {t("previewOpenExternal")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
