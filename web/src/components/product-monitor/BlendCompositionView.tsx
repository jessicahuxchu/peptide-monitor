"use client";

import { useTranslations } from "next-intl";
import { TierBadge } from "@/components/product-monitor/TierBadge";
import { useProductMonitor } from "@/components/providers/ProductMonitorProvider";
import {
  resolveSpecVariantLabel,
  specVariantFormLabel,
} from "@/lib/product-monitor/product-detail-utils";
import { cn } from "@/lib/utils";

export function BlendCompositionView() {
  const t = useTranslations("productMonitor.blends");
  const { data } = useProductMonitor();
  const productBlends = data.blends;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {productBlends.map((blend) => (
        <article
          key={blend.id}
          className="rounded-xl border border-command-border bg-command-card-elevated/30 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-command-teal-bright">
              {blend.name}
            </h4>
            <TierBadge tier={blend.tier} />
          </div>

          <ul className="space-y-1.5">
            {blend.components.map((c) => (
              <li
                key={`${blend.id}-${c.product}`}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-command-text">{c.product}</span>
                <span className="tabular-nums text-command-text-muted">{c.amount}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-command-border pt-3 text-[10px]">
            <span className="text-command-text-muted">
              {blend.platformCoverage}/{blend.platformTotal} {t("platforms")}
            </span>
            <span className="text-command-text-secondary">
              · {t(`stockMode.${blend.stockMode}`)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function isConsensusVariant(variant: string, consensusSpec: string): boolean {
  if (consensusSpec.includes(variant)) return true;
  const firstSegment = consensusSpec.split("、")[0]?.trim() ?? "";
  return variant === firstSegment || firstSegment.startsWith(`${variant} `);
}

export function SpecConsensusPanel({
  consensusSpec,
  primarySpecs,
  forms = [],
}: {
  consensusSpec: string;
  primarySpecs: string[];
  forms?: string[];
}) {
  const t = useTranslations("productMonitor.specs");

  return (
    <div className="space-y-3 text-sm">
      <Row label={t("consensus")} value={consensusSpec} highlight />
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
          {t("variants")}
        </p>
        <ul className="space-y-1.5">
          {primarySpecs.map((spec) => {
            const resolved = resolveSpecVariantLabel(spec, consensusSpec, forms);
            const formLabel = specVariantFormLabel(spec, resolved, forms);
            const isConsensus = isConsensusVariant(spec, consensusSpec);

            return (
              <li
                key={spec}
                className={cn(
                  "flex items-baseline justify-between gap-3 rounded-md border px-2.5 py-1.5 text-xs",
                  isConsensus
                    ? "border-command-teal/40 bg-command-teal/10"
                    : "border-command-border/60 bg-command-card-elevated/20",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 font-medium tabular-nums",
                    isConsensus ? "text-command-teal-bright" : "text-command-text",
                  )}
                >
                  {spec}
                </span>
                <span className="text-right text-command-text-secondary">{formLabel}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-xs",
          highlight ? "font-semibold text-command-teal-bright" : "text-command-text",
        )}
      >
        {value}
      </span>
    </div>
  );
}
