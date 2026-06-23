"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CommandCard } from "@/components/ui/CommandCard";
import { Sparkline } from "@/components/ui/Sparkline";
import { useDbResource } from "@/hooks/useDbResource";
import { skuOpportunities as fallbackSku } from "@/lib/supply-chain/seed-data";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const intelligenceFallback = {
  signals: [],
  skuOpportunities: fallbackSku,
};

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };

export function SkuOpportunitySection() {
  const t = useTranslations("productMonitor.opportunity");
  const { data } = useDbResource("/api/intelligence", intelligenceFallback);
  const sorted = [...data.skuOpportunities].sort(
    (a, b) => b.opportunityScore - a.opportunityScore,
  );
  const top = sorted[0];

  return (
    <CommandCard title={t("title")} subtitle={t("subtitle")}>
      <p className="mb-4 text-xs text-command-text-muted">{t("layerHint")}</p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi label={t("topSku")} value={top?.product ?? "—"} accent />
        <Kpi label={t("topScore")} value={String(top?.opportunityScore ?? "—")} />
        <Kpi label={t("formula")} value={t("formulaShort")} />
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-command-border text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">{t("product")}</th>
              <th className="pb-3 pr-4">{t("score")}</th>
              <th className="pb-3 pr-4">{t("demand")}</th>
              <th className="pb-3 pr-4">{t("priceGap")}</th>
              <th className="pb-3">{t("trend")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((sku, index) => {
              const TrendIcon = trendIcon[sku.trend];
              const gap = sku.localPrice - sku.competitivePrice;
              return (
                <tr
                  key={sku.id}
                  className="border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/50"
                >
                  <td className="py-3 pr-4 text-command-text-muted">{index + 1}</td>
                  <td className="py-3 pr-4 font-semibold text-command-teal-bright">
                    {sku.product}
                  </td>
                  <td className="py-3 pr-4">
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
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{sku.demandScore}</td>
                  <td className="py-3 pr-4 tabular-nums text-command-text-secondary">
                    ${gap > 0 ? "+" : ""}
                    {gap}
                  </td>
                  <td className="py-3">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-command-text-muted">
        {t("regulatoryRef")}{" "}
        <Link href="/regulatory" className="text-command-teal-bright hover:underline">
          {t("regulatoryLink")}
        </Link>
      </p>
    </CommandCard>
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
