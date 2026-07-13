"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDbResource } from "@/hooks/useDbResource";
import type { SocialPostsResponse } from "@/lib/social/types";
import { PRODUCT_ALIASES } from "@/lib/social/config";
import { cn, formatDate } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

const empty: SocialPostsResponse = { posts: [], total: 0 };

export default function SocialPostsPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const { data, loading, error } = useDbResource("/api/social-posts?limit=200", empty);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [regulatoryOnly, setRegulatoryOnly] = useState(false);

  const products = useMemo(
    () => ["all", ...PRODUCT_ALIASES.map((p) => p.product)],
    [],
  );

  const filtered = useMemo(() => {
    return data.posts.filter((p) => {
      if (productFilter !== "all" && !p.products.includes(productFilter)) {
        return false;
      }
      if (regulatoryOnly && !p.hasRegulatory) return false;
      return true;
    });
  }, [data.posts, productFilter, regulatoryOnly]);

  return (
    <div className="mx-auto max-w-[960px] p-4 md:p-6">
      <div className="mb-4 rounded-lg border border-command-border/60 bg-command-card/40 px-3 py-2 text-[11px] text-command-text-muted">
        {t("pages.socialPosts.hiddenNote")}{" "}
        <Link href="/intelligence" className="text-command-teal-bright hover:underline">
          {t("nav.intelligence")}
        </Link>
      </div>

      <CommandCard
        title={t("pages.socialPosts.title")}
        subtitle={t("pages.socialPosts.description")}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {products.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProductFilter(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                productFilter === p
                  ? "border-command-teal/50 bg-command-teal/10 text-command-teal-bright"
                  : "border-command-border text-command-text-secondary hover:text-command-text",
              )}
            >
              {p === "all" ? t("pages.socialPosts.allProducts") : p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRegulatoryOnly((v) => !v)}
            className={cn(
              "ml-auto rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              regulatoryOnly
                ? "border-command-orange/50 bg-command-orange/10 text-command-orange"
                : "border-command-border text-command-text-secondary",
            )}
          >
            {t("pages.socialPosts.regulatoryOnly")}
          </button>
        </div>

        {loading && (
          <p className="text-sm text-command-text-muted">{t("pages.socialPosts.loading")}</p>
        )}
        {error && (
          <p className="text-sm text-command-red">{error}</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-command-text-muted">{t("pages.socialPosts.empty")}</p>
        )}

        <ul className="space-y-3">
          {filtered.map((post) => (
            <li
              key={post.id}
              className="rounded-xl border border-command-border bg-command-card-elevated p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-command-text-muted">
                <span className="rounded border border-command-border px-1.5 py-0.5">
                  {post.platform}
                </span>
                {post.subreddit && <span>r/{post.subreddit}</span>}
                <span>{formatDate(post.postedAt, locale)}</span>
                <span>
                  ↑{post.score} · {post.numComments} comments · eng {post.engagement}
                </span>
                {post.hasRegulatory && (
                  <span className="inline-flex items-center gap-1 text-command-orange">
                    <ShieldAlert className="h-3 w-3" />
                    regulatory
                    {post.classifiedBy === "agent" && (
                      <span className="normal-case text-[9px] text-command-text-muted">
                        · AI
                      </span>
                    )}
                  </span>
                )}
              </div>

              <h3 className="mt-2 text-sm font-semibold text-command-text">
                {post.title}
              </h3>
              {post.body && (
                <p className="mt-1 line-clamp-3 text-sm text-command-text-secondary">
                  {post.body}
                </p>
              )}
              {post.hasRegulatory && post.regulatoryReason && (
                <p className="mt-2 text-[11px] text-command-orange/90">
                  {post.regulatoryReason}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {post.products.map((prod) => (
                  <span
                    key={prod}
                    className="rounded border border-command-teal/30 px-1.5 py-0.5 text-[10px] text-command-teal-bright"
                  >
                    {prod}
                  </span>
                ))}
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-[11px] text-command-teal-bright hover:underline"
                >
                  Reddit
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[11px] text-command-text-muted">
          {t("pages.socialPosts.showing", {
            shown: filtered.length,
            total: data.total,
          })}
        </p>
      </CommandCard>
    </div>
  );
}
