"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Sparkline } from "@/components/ui/Sparkline";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import { useDbResource } from "@/hooks/useDbResource";
import {
  regulatoryEntries as fallbackRegulatory,
  skuOpportunities as fallbackSku,
} from "@/lib/supply-chain/seed-data";
import { getProductRegulatoryRisk } from "@/lib/regulatory/matrix";
import type { InventoryTier, ProductMonitorRecord } from "@/lib/product-monitor/types";
import type { SkuOpportunity } from "@/lib/supply-chain/seed-data";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const riskVariant = {
  low: "optimal" as const,
  medium: "delayed" as const,
  high: "critical" as const,
};

const tierVariant: Record<InventoryTier, "optimal" | "delayed" | "critical"> = {
  core: "optimal",
  trial: "delayed",
  avoid: "critical",
};

const strategyTitleKey: Record<InventoryTier, "coreTitle" | "trialTitle" | "avoidTitle"> = {
  core: "coreTitle",
  trial: "trialTitle",
  avoid: "avoidTitle",
};

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };

const intelligenceFallback = {
  signals: [],
  skuOpportunities: fallbackSku,
};

function introForLocale(
  intro: ProductMonitorRecord["productIntro"],
  locale: string,
): string | undefined {
  if (!intro) return undefined;
  return locale.startsWith("zh") ? intro.zh : intro.en;
}

interface ProductDecisionMatrixProps {
  records: ProductMonitorRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProductDecisionMatrix({
  records,
  selectedId,
  onSelect,
}: ProductDecisionMatrixProps) {
  const t = useTranslations("productMonitor");
  const tOpp = useTranslations("productMonitor.opportunity");
  const locale = useLocale();
  const { data: intel } = useDbResource("/api/intelligence", intelligenceFallback);
  const { data: regulatoryEntries } = useDbResource(
    "/api/regulatory",
    fallbackRegulatory,
  );
  const [tierFilter, setTierFilter] = useState<InventoryTier | "all">("all");

  const skuByProduct = useMemo(() => {
    const map = new Map<string, SkuOpportunity>();
    for (const sku of intel.skuOpportunities) {
      map.set(sku.product.toLowerCase(), sku);
    }
    return map;
  }, [intel.skuOpportunities]);

  const filtered = useMemo(() => {
    const list =
      tierFilter === "all" ? records : records.filter((r) => r.tier === tierFilter);
    return [...list].sort((a, b) => b.compositeScore - a.compositeScore);
  }, [records, tierFilter]);

  const topOpportunity = useMemo(
    () =>
      [...intel.skuOpportunities].sort(
        (a, b) => b.opportunityScore - a.opportunityScore,
      )[0],
    [intel.skuOpportunities],
  );

  const tiers: (InventoryTier | "all")[] = ["all", "core", "trial", "avoid"];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi label={tOpp("topSku")} value={topOpportunity?.product ?? "—"} accent />
        <Kpi
          label={tOpp("topScore")}
          value={String(topOpportunity?.opportunityScore ?? "—")}
        />
        <Kpi label={tOpp("formula")} value={tOpp("formulaShort")} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tiers.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setTierFilter(tier)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
              tierFilter === tier
                ? "border-command-teal/40 bg-command-teal/10 text-command-teal-bright"
                : "border-command-border text-command-text-muted hover:text-command-text-secondary",
            )}
          >
            {tier === "all" ? t("filters.allTiers") : t(`strategy.${strategyTitleKey[tier]}`)}
          </button>
        ))}
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-command-border text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
              <th className="pb-3 pr-3">{t("table.product")}</th>
              <th className="pb-3 pr-3">{t("table.productIntro")}</th>
              <th className="pb-3 pr-3">{t("table.conclusion")}</th>
              <th className="pb-3 pr-3">{t("table.score")}</th>
              <th className="pb-3 pr-3">{tOpp("score")}</th>
              <th className="pb-3 pr-3">{tOpp("demand")}</th>
              <th className="pb-3 pr-3">{tOpp("priceGap")}</th>
              <th className="pb-3 pr-3">{t("table.coverage")}</th>
              <th className="pb-3 pr-3">{tOpp("trend")}</th>
              <th className="pb-3">{t("table.auRisk")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => {
              const sku = skuByProduct.get(record.product.toLowerCase());
              const gap =
                sku != null ? sku.localPrice - sku.competitivePrice : null;
              const TrendIcon = sku ? trendIcon[sku.trend] : null;
              const intro = introForLocale(record.productIntro, locale);

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelect(record.id)}
                  className={cn(
                    "cursor-pointer border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/50",
                    selectedId === record.id && "bg-command-teal/5",
                  )}
                >
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-command-teal-bright">{record.product}</p>
                    <p className="text-[10px] text-command-text-muted">{record.primarySpec}</p>
                  </td>
                  <td className="max-w-[220px] py-3 pr-3">
                    {intro ? (
                      <p
                        className="line-clamp-2 text-[11px] leading-snug text-command-text-secondary"
                        title={intro}
                      >
                        {intro}
                      </p>
                    ) : (
                      <span className="text-[11px] text-command-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <StrategyTierBadge tier={record.tier} />
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        record.compositeScore >= 70
                          ? "text-command-green"
                          : record.compositeScore >= 45
                            ? "text-command-orange"
                            : "text-command-text-secondary",
                      )}
                    >
                      {record.compositeScore}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    {sku ? (
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          sku.opportunityScore >= 60
                            ? "text-command-green"
                            : sku.opportunityScore >= 40
                              ? "text-command-orange"
                              : "text-command-text-secondary",
                        )}
                      >
                        {sku.opportunityScore}
                      </span>
                    ) : (
                      <span className="text-command-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 tabular-nums">
                    {sku ? sku.demandScore : "—"}
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-command-text-secondary">
                    {gap != null ? (
                      <>
                        ${gap > 0 ? "+" : ""}
                        {gap}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <CoverageMiniBar record={record} />
                  </td>
                  <td className="py-3 pr-3">
                    {sku && TrendIcon ? (
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
                    ) : (
                      <span className="text-command-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <RegulatoryRiskLink
                      product={record.product}
                      entries={regulatoryEntries}
                      label={t(
                        `risk.${getProductRegulatoryRisk(record.product, regulatoryEntries)}`,
                      )}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-command-text-muted">
        {tOpp("regulatoryRef")}{" "}
        <Link href="/regulatory" className="text-command-teal-bright hover:underline">
          {tOpp("regulatoryLink")}
        </Link>
      </p>
    </div>
  );
}

function StrategyTierBadge({ tier }: { tier: InventoryTier }) {
  const t = useTranslations("productMonitor.strategy");
  return (
    <StatusBadge variant={tierVariant[tier]} className="whitespace-nowrap text-[10px]">
      {t(strategyTitleKey[tier])}
    </StatusBadge>
  );
}

function Kpi({
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

function RegulatoryRiskLink({
  product,
  entries,
  label,
}: {
  product: string;
  entries: typeof fallbackRegulatory;
  label: string;
}) {
  const risk = getProductRegulatoryRisk(product, entries);
  return (
    <Link href="/regulatory" className="inline-flex" title={product}>
      <StatusBadge variant={riskVariant[risk]}>{label}</StatusBadge>
    </Link>
  );
}

function CoverageMiniBar({ record }: { record: ProductMonitorRecord }) {
  const { data } = useProductMonitor();
  const platforms = data.platforms;
  const pct = Math.round((record.platformCoverage / record.platformTotal) * 100);

  return (
    <div className="min-w-[100px]">
      <div className="mb-1 flex gap-px">
        {platforms.map((p) => {
          const level = record.platformPresence[p.id];
          return (
            <span
              key={p.id}
              className={cn(
                "h-3 flex-1 rounded-sm",
                level === 0 && "bg-command-border/50",
                level === 1 && "bg-command-teal/30",
                level === 2 && "bg-command-teal/60",
                level === 3 && "bg-command-teal-bright/80",
              )}
              title={p.name}
            />
          );
        })}
      </div>
      <span className="text-[10px] tabular-nums text-command-text-muted">
        {record.platformCoverage}/{record.platformTotal} ({pct}%)
      </span>
    </div>
  );
}
