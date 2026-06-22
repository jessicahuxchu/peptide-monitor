"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import {
  catalogBandCounts,
  catalogEntries,
} from "@/lib/product-monitor/catalog-data";
import type { CatalogEntry, CoverageBand } from "@/lib/product-monitor/types";
import { cn } from "@/lib/utils";

const BAND_ORDER: CoverageBand[] = ["high", "medium", "low"];
const PREVIEW_LIMIT: Record<CoverageBand, number> = {
  high: 20,
  medium: 8,
  low: 10,
  none: 10,
};

interface CatalogOverviewProps {
  onSelectDecision?: (decisionId: string) => void;
}

export function CatalogOverview({ onSelectDecision }: CatalogOverviewProps) {
  const t = useTranslations("productMonitor.catalog");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedBands, setExpandedBands] = useState<Set<CoverageBand>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogEntries;
    return catalogEntries.filter((e) => e.product.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const map: Record<CoverageBand, CatalogEntry[]> = {
      high: [],
      medium: [],
      low: [],
      none: [],
    };
    for (const e of filtered) map[e.coverageBand].push(e);
    return map;
  }, [filtered]);

  const decisionInCatalog = catalogEntries.filter((e) => e.decisionId).length;

  const toggleBand = (band: CoverageBand) => {
    setExpandedBands((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  };

  return (
    <section className="rounded-xl border border-command-border/80 bg-command-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-command-card-elevated/30"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-command-text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-command-text-muted" />
          )}
          <span className="text-sm font-medium text-command-text">{t("title")}</span>
          <span className="text-xs text-command-text-muted">
            {catalogEntries.length} {t("types")} · {decisionInCatalog} {t("inDecision")}
          </span>
        </div>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {BAND_ORDER.map((band) => (
            <BandPill key={band} band={band} count={catalogBandCounts[band]} />
          ))}
        </div>
      </button>

      {open && (
        <div className="border-t border-command-border px-4 pb-4 pt-3">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-command-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-command-border bg-command-bg py-2 pl-9 pr-3 text-sm text-command-text placeholder:text-command-text-muted focus:border-command-teal/40 focus:outline-none"
            />
          </div>

          {query && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-command-text-muted">{t("noResults")}</p>
          )}

          <div className="space-y-3">
            {BAND_ORDER.map((band) => {
              const items = grouped[band];
              if (items.length === 0) return null;

              const showAll = expandedBands.has(band) || query.length > 0;
              const limit = query ? items.length : PREVIEW_LIMIT[band];
              const visible = showAll ? items : items.slice(0, limit);
              const hidden = items.length - visible.length;

              return (
                <div key={band}>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-command-text-muted">
                      {t(`bands.${band}`)} · {items.length}
                    </h4>
                    {!query && hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleBand(band)}
                        className="text-[11px] text-command-teal-bright hover:underline"
                      >
                        {showAll ? t("showLess") : t("showAll", { count: items.length })}
                      </button>
                    )}
                  </div>
                  <ul className="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-command-border/50 bg-command-bg/50 p-1">
                    {visible.map((entry) => (
                      <CatalogRow
                        key={entry.id}
                        entry={entry}
                        onSelectDecision={onSelectDecision}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function CatalogRow({
  entry,
  onSelectDecision,
}: {
  entry: CatalogEntry;
  onSelectDecision?: (id: string) => void;
}) {
  const t = useTranslations("productMonitor.catalog");
  const pct = Math.round((entry.platformCoverage / entry.platformTotal) * 100);
  const clickable = Boolean(entry.decisionId && onSelectDecision);

  return (
    <li>
      <button
        type="button"
        disabled={!clickable}
        onClick={() => entry.decisionId && onSelectDecision?.(entry.decisionId)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
          clickable
            ? "hover:bg-command-teal/10 cursor-pointer"
            : "cursor-default opacity-80",
        )}
      >
        <span className="min-w-0 truncate text-command-text">{entry.product}</span>
        <span className="flex shrink-0 items-center gap-2 tabular-nums">
          {entry.decisionId && (
            <span className="rounded border border-command-teal/30 px-1 py-px text-[9px] font-semibold uppercase text-command-teal-bright">
              {t("decision")}
            </span>
          )}
          <span className="text-command-text-muted">
            {entry.platformCoverage}/{entry.platformTotal}
          </span>
          <CoverageDot pct={pct} />
        </span>
      </button>
    </li>
  );
}

function CoverageDot({ pct }: { pct: number }) {
  const color =
    pct >= 83
      ? "bg-command-teal-bright"
      : pct >= 42
        ? "bg-command-teal/60"
        : "bg-command-border";

  return <span className={cn("h-1.5 w-6 rounded-full", color)} />;
}

function BandPill({ band, count }: { band: CoverageBand; count: number }) {
  const t = useTranslations("productMonitor.catalog.bands");

  const style = {
    high: "border-command-teal/30 text-command-teal-bright",
    medium: "border-command-orange/30 text-command-orange",
    low: "border-command-border text-command-text-muted",
    none: "border-command-border text-command-text-muted",
  }[band];

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", style)}>
      {t(band)} {count}
    </span>
  );
}
