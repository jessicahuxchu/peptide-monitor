"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { PlatformCoverageMap } from "@/components/product-monitor/PlatformCoverageMap";
import { SpecConsensusPanel } from "@/components/product-monitor/BlendCompositionView";
import { TierBadge } from "@/components/product-monitor/TierBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useProductViability } from "@/hooks/useProductViability";
import {
  getBlendsForProductFromData,
  useProductMonitor,
} from "@/components/providers/ProductMonitorProvider";
import { getProductRegulatoryRisk } from "@/lib/regulatory/matrix";
import { buildStrategicSummary } from "@/lib/product-monitor/product-detail-utils";
import { introFullForLocale } from "@/lib/product-monitor/product-intro-utils";
import type { ProductMonitorRecord } from "@/lib/product-monitor/types";
import { cn } from "@/lib/utils";

const riskVariant = {
  low: "optimal" as const,
  medium: "delayed" as const,
  high: "critical" as const,
};

interface ProductDetailPanelProps {
  record: ProductMonitorRecord;
  onClose: () => void;
}

export function ProductDetailPanel({ record, onClose }: ProductDetailPanelProps) {
  const t = useTranslations("productMonitor");
  const tVia = useTranslations("productMonitor.viability");
  const locale = useLocale();
  const { data } = useProductMonitor();
  const { index, regulatoryEntries, ready } = useProductViability();
  const assessment = index.get(record.id);
  const matrixRisk = getProductRegulatoryRisk(record.product, regulatoryEntries);
  const blends = getBlendsForProductFromData(data, record.id);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    intro: true,
  });
  const intro = introFullForLocale(record.productIntro, locale);

  const actionTier = ready ? (assessment?.actionTier ?? record.tier) : record.tier;
  const viabilityScore = ready ? assessment?.viabilityScore : undefined;
  const breakdown = ready ? assessment?.breakdown : undefined;
  const strategicSummary = buildStrategicSummary(
    ready ? tVia(`action.${actionTier}`) : undefined,
    record.stockingLogic,
    record.specProfile.notes,
  );

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="flex max-h-[70vh] flex-col rounded-xl border border-command-border bg-command-card lg:max-h-none lg:h-full">
      <header className="flex items-start justify-between gap-3 border-b border-command-border p-3">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <TierBadge tier={actionTier} />
            <Link href="/regulatory" className="inline-flex">
              <StatusBadge variant={riskVariant[matrixRisk]}>
                {t(`risk.${matrixRisk}`)}
              </StatusBadge>
            </Link>
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                viabilityScore == null
                  ? "text-command-text-muted"
                  : viabilityScore >= 65
                    ? "text-command-green"
                    : viabilityScore >= 42
                      ? "text-command-orange"
                      : "text-command-text-secondary",
              )}
              title={tVia("score")}
            >
              {viabilityScore ?? "—"}
            </span>
            <span className="text-[10px] text-command-text-muted">{tVia("score")}</span>
          </div>
          <h3 className="text-sm font-semibold text-command-text">{record.product}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-command-border p-1.5 text-command-text-muted hover:text-command-text"
          aria-label={t("detail.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        <DetailCollapse
          title={t("detail.productIntro")}
          open={!!openSections.intro}
          onToggle={() => toggleSection("intro")}
        >
          <p className="text-xs leading-relaxed text-command-text-secondary">
            {intro ?? t("detail.productIntroEmpty")}
          </p>
        </DetailCollapse>

        {strategicSummary && (
          <DetailCollapse
            title={t("detail.strategicSummary")}
            open={!!openSections.strategy}
            onToggle={() => toggleSection("strategy")}
          >
            <p className="text-xs leading-relaxed text-command-text-secondary">
              {strategicSummary}
            </p>
          </DetailCollapse>
        )}

        {breakdown && (
          <DetailCollapse
            title={tVia("breakdownTitle")}
            open={!!openSections.breakdown}
            onToggle={() => toggleSection("breakdown")}
          >
            <p className="mb-2 text-[10px] text-command-text-muted">{tVia("formulaShort")}</p>
            <dl className="space-y-2">
              <BreakdownRow
                label={tVia("marketSignal")}
                weight={tVia("weights.marketSignal")}
                value={breakdown.marketSignal}
              />
              <BreakdownRow
                label={tVia("platformValidation")}
                weight={tVia("weights.platformValidation")}
                value={breakdown.platformValidation}
              />
              <BreakdownRow
                label={tVia("operationalFit")}
                weight={tVia("weights.operationalFit")}
                value={breakdown.operationalFit}
              />
              <BreakdownRow
                label={tVia("regulatoryAllowance")}
                weight={tVia("weights.regulatoryAllowance")}
                value={breakdown.regulatoryAllowance}
              />
            </dl>
          </DetailCollapse>
        )}

        <DetailCollapse
          title={t("detail.supplyChain")}
          open={!!openSections.supply}
          onToggle={() => toggleSection("supply")}
        >
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <DetailRow label={t("detail.stockWeeks")} value={record.supplyMetrics.stockWeeks} />
            <DetailRow
              label={t("detail.leadTime")}
              value={`${record.supplyMetrics.leadTimeDays}${t("detail.days")}`}
            />
          </dl>
        </DetailCollapse>

        <DetailCollapse
          title={t("specs.title")}
          open={!!openSections.specs}
          onToggle={() => toggleSection("specs")}
        >
          <SpecConsensusPanel
            consensusSpec={record.specProfile.consensusSpec}
            primarySpecs={record.specProfile.primarySpecs}
            forms={record.specProfile.forms}
          />
        </DetailCollapse>

        {blends.length > 0 && (
          <DetailCollapse
            title={t("blends.title")}
            open={!!openSections.blends}
            onToggle={() => toggleSection("blends")}
          >
            <div className="space-y-1.5">
              {blends.map((b) => (
                <p key={b.id} className="text-[11px] text-command-text-muted">
                  <span className="font-medium text-command-teal-bright">{b.name}</span>
                  {" · "}
                  {b.components.map((c) => `${c.product} ${c.amount}`).join(" + ")}
                </p>
              ))}
            </div>
          </DetailCollapse>
        )}

        <DetailCollapse
          title={`${t("coverage.title")} (${record.platformCoverage}/${record.platformTotal})`}
          open={!!openSections.coverage}
          onToggle={() => toggleSection("coverage")}
        >
          <PlatformCoverageMap record={record} />
        </DetailCollapse>

        {record.regulatoryNotes.length > 0 && (
          <DetailCollapse
            title={t("detail.regulatory")}
            open={!!openSections.regulatory}
            onToggle={() => toggleSection("regulatory")}
          >
            <ul className="space-y-1">
              {record.regulatoryNotes.map((note) => (
                <li
                  key={note}
                  className="rounded-md border border-command-orange/20 bg-command-orange/5 px-2.5 py-1.5 text-[11px] text-command-text-secondary"
                >
                  {note}
                </li>
              ))}
            </ul>
          </DetailCollapse>
        )}
      </div>
    </aside>
  );
}

function DetailCollapse({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-command-border/40 pb-2 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 py-1.5 text-[11px] font-medium text-command-teal-bright"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {title}
      </button>
      {open && <div className="pb-2 pt-0.5">{children}</div>}
    </div>
  );
}

function BreakdownRow({
  label,
  weight,
  value,
}: {
  label: string;
  weight: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-[5.5rem] shrink-0 text-command-text-muted">
        {label}
        <span className="ml-1 text-[9px] text-command-text-muted/70">{weight}</span>
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-command-border/60">
        <div
          className={cn(
            "h-full rounded-full",
            value >= 65 ? "bg-command-green/70" : value >= 42 ? "bg-command-orange/70" : "bg-command-text-muted/50",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-6 text-right tabular-nums text-command-text-secondary">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-command-text-muted">{label}</dt>
      <dd className="text-right font-medium text-command-text">{value}</dd>
    </>
  );
}
