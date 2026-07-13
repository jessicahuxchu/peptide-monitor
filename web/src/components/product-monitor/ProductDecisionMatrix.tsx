"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Sparkline } from "@/components/ui/Sparkline";
import { CoverageLegendHelp } from "@/components/product-monitor/CoverageLegendHelp";
import { PriceGapLegendHelp } from "@/components/product-monitor/PriceGapLegendHelp";
import { calcPriceGap, formatPriceGap } from "@/lib/supply-chain/price-gap";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import { useProductViability } from "@/hooks/useProductViability";
import { getProductRegulatoryRisk } from "@/lib/regulatory/matrix";
import { introBriefForLocale } from "@/lib/product-monitor/product-intro-utils";
import type { InventoryTier, ProductMonitorRecord } from "@/lib/product-monitor/types";
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
  const tVia = useTranslations("productMonitor.viability");
  const locale = useLocale();
  const { index, skuByProduct, regulatoryEntries } = useProductViability();
  const [tierFilter, setTierFilter] = useState<InventoryTier | "all">("all");

  const filtered = useMemo(() => {
    const list =
      tierFilter === "all"
        ? records
        : records.filter((r) => index.get(r.id)?.actionTier === tierFilter);
    return [...list].sort((a, b) => {
      const av = index.get(a.id)?.viabilityScore ?? 0;
      const bv = index.get(b.id)?.viabilityScore ?? 0;
      return bv - av;
    });
  }, [records, tierFilter, index]);

  const tiers: (InventoryTier | "all")[] = ["all", "core", "trial", "avoid"];

  return (
    <div>
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
        <table className="w-full min-w-[800px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[6.5rem]" />
            <col className="w-[9rem]" />
            <col className="w-[8.5rem]" />
            <col className="w-[3.5rem]" />
            <col className="w-[4rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-[3.5rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-command-border text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
              <th className="pb-3 pr-2">{t("table.product")}</th>
              <th className="pb-3 pr-3">{t("table.productIntro")}</th>
              <th className="pb-3 pr-3">{t("table.conclusion")}</th>
              <th className="pb-3 pr-3">{tVia("score")}</th>
              <th className="pb-3 pr-3">
                <span className="inline-flex items-center gap-1">
                  {tOpp("priceGap")}
                  <PriceGapLegendHelp />
                </span>
              </th>
              <th className="pb-3 pr-3">
                <span className="inline-flex items-center gap-1">
                  {t("table.coverage")}
                  <CoverageLegendHelp />
                </span>
              </th>
              <th className="pb-3 pr-3">{tOpp("trend")}</th>
              <th className="pb-3">{t("table.auRisk")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => {
              const assessment = index.get(record.id);
              const sku = skuByProduct.get(record.product.toLowerCase());
              const gap = calcPriceGap(sku);
              const TrendIcon = sku ? trendIcon[sku.trend] : null;
              const intro = introBriefForLocale(record.productIntro, locale);
              const introFull = record.productIntro
                ? locale.startsWith("zh")
                  ? record.productIntro.zh
                  : record.productIntro.en
                : undefined;
              const viabilityScore = assessment?.viabilityScore ?? 0;
              const actionTier = assessment?.actionTier ?? record.tier;

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelect(record.id)}
                  className={cn(
                    "cursor-pointer border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/50",
                    selectedId === record.id && "bg-command-teal/5",
                  )}
                >
                  <td className="py-3 pr-2">
                    <p className="truncate text-xs font-semibold text-command-teal-bright">
                      {record.product}
                    </p>
                    <p className="truncate text-[10px] text-command-text-muted">
                      {record.primarySpec}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    {intro ? (
                      <p
                        className="line-clamp-1 text-[11px] leading-snug text-command-text-secondary"
                        title={introFull}
                      >
                        {intro}
                      </p>
                    ) : (
                      <span className="text-[11px] text-command-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <StrategyTierBadge tier={actionTier} />
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        viabilityScore >= 65
                          ? "text-command-green"
                          : viabilityScore >= 42
                            ? "text-command-orange"
                            : "text-command-text-secondary",
                      )}
                    >
                      {viabilityScore}
                    </span>
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-command-text-secondary">
                    {formatPriceGap(gap)}
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

function RegulatoryRiskLink({
  product,
  entries,
  label,
}: {
  product: string;
  entries: Parameters<typeof getProductRegulatoryRisk>[1];
  label: string;
}) {
  const risk = getProductRegulatoryRisk(product, entries);
  return (
    <Link href="/regulatory" className="inline-flex" title={product}>
      <StatusBadge variant={riskVariant[risk]}>{label}</StatusBadge>
    </Link>
  );
}
