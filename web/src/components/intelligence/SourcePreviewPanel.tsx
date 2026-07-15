"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ShieldAlert, X } from "lucide-react";
import type { IntelSignal } from "@/lib/intelligence/seed-data";
import { isConcreteArticleUrl } from "@/lib/social/news-url";
import type { SocialPost } from "@/lib/social/types";
import { cn, formatDate } from "@/lib/utils";

interface SourcePreviewPanelProps {
  signals: IntelSignal[];
  signal: IntelSignal;
  post: SocialPost | null;
  /** Related articles for volume digests (e.g. 「近 7 日报道 N 条」). */
  relatedPosts?: SocialPost[];
  loading: boolean;
  dateLabel?: string | null;
  onSelect: (signal: IntelSignal) => void;
  onClose: () => void;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Prefer a unique body; drop empty or near-duplicate-of-title bodies. */
function resolveBody(title: string, body: string | null | undefined): string | null {
  const t = normalizeText(title);
  const b = normalizeText(body ?? "");
  if (!b) return null;
  const tl = t.toLowerCase();
  const bl = b.toLowerCase();
  if (bl === tl) return null;
  if (bl.includes(tl) || tl.includes(bl)) {
    // Nearly the same SEO title repeated as snippet — treat as no body.
    const shorter = Math.min(tl.length, bl.length);
    const longer = Math.max(tl.length, bl.length);
    if (shorter > 0 && shorter / longer >= 0.7) return null;
  }
  if (bl.startsWith(tl)) {
    const rest = normalizeText(b.slice(t.length).replace(/^[\s\-–—|:·]+/, ""));
    return rest || null;
  }
  return b;
}

function ExternalLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-command-teal-bright hover:underline"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function SourcePreviewPanel({
  signals,
  signal,
  post,
  relatedPosts = [],
  loading,
  dateLabel,
  onSelect,
  onClose,
}: SourcePreviewPanelProps) {
  const t = useTranslations("intelligencePage");
  const locale = useLocale() as "en" | "zh";
  const isVolumeDigest = signal.id.startsWith("news-legal-vol-");
  const externalUrl = post?.url ?? signal.url;
  const articleLinkOk = externalUrl ? isConcreteArticleUrl(externalUrl) : false;
  const isNews =
    signal.source === "news_legal" || post?.platform === "google_news";
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const postBody = post ? resolveBody(post.title, post.body) : null;
  const signalBody = resolveBody(signal.title, signal.summary);
  const displayTitle = post?.title ?? signal.title;
  const displayBody = post ? postBody : signalBody;
  const hasFullBody = Boolean(displayBody);
  const showFallbackHint = !loading && !post && !hasFullBody && !isVolumeDigest;
  const previewExpands =
    hasFullBody || (isVolumeDigest && relatedPosts.length > 0);

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

      {/* Day list — grows when preview is short (no body) */}
      <div
        className={cn(
          "min-h-0 overflow-y-auto border-b border-command-border",
          previewExpands ? "flex-[2]" : "flex-1",
        )}
      >
        {signals.length === 0 ? (
          <p className="px-3 py-4 text-xs text-command-text-muted">
            {t("summaryEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-command-border/60">
            {signals.map((item) => {
              const active = item.id === signal.id;
              const rumored =
                item.dimension === "regulatory" && item.source === "social";
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

      {/* Preview — content-sized when empty; expands when there is a body / volume list */}
      <div
        className={cn(
          "flex flex-col border-t border-command-border/0",
          previewExpands ? "min-h-0 flex-[3] overflow-y-auto" : "shrink-0",
        )}
      >
        <div className="shrink-0 px-3 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
            {isVolumeDigest
              ? t("previewVolumeList", { count: relatedPosts.length || "—" })
              : isNews
                ? t("previewArticle")
                : t("previewPost")}
          </p>
        </div>

        <div className="space-y-2.5 px-3 py-2.5">
          {loading && (
            <p className="text-xs text-command-text-muted">{t("previewLoading")}</p>
          )}

          {!loading && isVolumeDigest && (
            <div className="space-y-2">
              <p className="text-[11px] text-command-text-muted">
                {signal.summary}
              </p>
              {relatedPosts.length === 0 ? (
                <p className="text-xs text-command-text-muted">
                  {t("previewVolumeEmpty")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {relatedPosts.map((item) => {
                    const linkOk = isConcreteArticleUrl(item.url);
                    return (
                      <li
                        key={item.id}
                        className="rounded-lg border border-command-border/70 bg-command-card/40 p-2.5"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] text-command-text-muted">
                          {item.subreddit && (
                            <span className="normal-case">{item.subreddit}</span>
                          )}
                          <span>{formatDate(item.postedAt, locale)}</span>
                        </div>
                        <p className="text-[11px] font-medium leading-snug text-command-text">
                          {item.title}
                        </p>
                        {linkOk ? (
                          <div className="mt-1.5">
                            <ExternalLinkRow
                              href={item.url}
                              label={t("previewOpenExternal")}
                            />
                          </div>
                        ) : (
                          <p className="mt-1.5 text-[10px] text-command-orange/90">
                            {t("previewWeakLink")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {!loading && !isVolumeDigest && (
            <>
              {post && (
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-command-text-muted">
                  <span className="rounded border border-command-border px-1.5 py-0.5">
                    {post.platform}
                  </span>
                  {post.subreddit && (
                    <span className="normal-case">
                      {post.platform === "google_news"
                        ? post.subreddit
                        : `r/${post.subreddit}`}
                    </span>
                  )}
                  {post.author && (
                    <span className="normal-case">{post.author}</span>
                  )}
                  <span>{formatDate(post.postedAt, locale)}</span>
                  {(post.score > 0 || post.numComments > 0) && (
                    <span>
                      ↑{post.score} · {post.numComments} comments
                    </span>
                  )}
                  {post.hasRegulatory && post.platform !== "google_news" && (
                    <span className="inline-flex items-center gap-1 normal-case text-command-orange">
                      <ShieldAlert className="h-3 w-3" />
                      {t("rumorBadge")}
                    </span>
                  )}
                </div>
              )}

              <h3 className="text-sm font-semibold leading-snug text-command-text">
                {displayTitle}
              </h3>

              {hasFullBody ? (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-command-text-secondary">
                  {displayBody}
                </p>
              ) : (
                <p className="text-xs text-command-text-muted">
                  {showFallbackHint ? t("previewFallback") : t("previewNoBody")}
                </p>
              )}

              {post?.hasRegulatory && post.regulatoryReason && (
                <p className="rounded-lg border border-command-orange/25 bg-command-orange/5 p-2 text-[11px] text-command-orange/90">
                  {post.regulatoryReason}
                </p>
              )}

              {(post?.products.length || signal.products.length) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(post?.products ?? signal.products).map((prod) => (
                    <span
                      key={prod}
                      className="rounded border border-command-teal/30 px-1.5 py-0.5 text-[10px] text-command-teal-bright"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              )}

              {externalUrl && articleLinkOk && (
                <div className="pt-0.5">
                  <ExternalLinkRow href={externalUrl} label={t("previewOpenExternal")} />
                </div>
              )}
              {externalUrl && !articleLinkOk && (
                <p className="pt-0.5 text-[11px] text-command-orange/90">
                  {t("previewWeakLink")}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
