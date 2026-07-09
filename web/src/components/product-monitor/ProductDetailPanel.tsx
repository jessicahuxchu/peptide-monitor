"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { PlatformCoverageMap } from "@/components/product-monitor/PlatformCoverageMap";
import { SpecConsensusPanel } from "@/components/product-monitor/BlendCompositionView";
import { TierBadge } from "@/components/product-monitor/TierBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDbResource } from "@/hooks/useDbResource";
import {
  getBlendsForProductFromData,
  useProductMonitor,
} from "@/components/providers/ProductMonitorProvider";
import { regulatoryEntries as fallbackRegulatory } from "@/lib/supply-chain/seed-data";
import { getProductRegulatoryRisk } from "@/lib/regulatory/matrix";
import type { ProductMonitorRecord } from "@/lib/product-monitor/types";

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
  const locale = useLocale();
  const { data } = useProductMonitor();
  const { data: regulatoryEntries } = useDbResource(
    "/api/regulatory",
    fallbackRegulatory,
  );
  const matrixRisk = getProductRegulatoryRisk(record.product, regulatoryEntries);
  const blends = getBlendsForProductFromData(data, record.id);
  const [showPlatforms, setShowPlatforms] = useState(false);
  const intro = record.productIntro
    ? locale.startsWith("zh")
      ? record.productIntro.zh
      : record.productIntro.en
    : undefined;

  return (
    <aside className="flex max-h-[70vh] flex-col rounded-xl border border-command-border bg-command-card lg:max-h-none lg:h-full">
      <header className="flex items-start justify-between gap-3 border-b border-command-border p-3">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <TierBadge tier={record.tier} />
            <Link href="/regulatory" className="inline-flex">
              <StatusBadge variant={riskVariant[matrixRisk]}>
                {t(`risk.${matrixRisk}`)}
              </StatusBadge>
            </Link>
            <span className="text-lg font-bold tabular-nums text-command-teal-bright">
              {record.compositeScore}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-command-text">{record.product}</h3>
          <p className="text-[11px] text-command-text-muted">{record.primarySpec}</p>
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

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <section>
          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
            {t("detail.productIntro")}
          </h4>
          <p className="text-xs leading-relaxed text-command-text-secondary">
            {intro ?? t("detail.productIntroEmpty")}
          </p>
        </section>

        <p className="text-xs leading-relaxed text-command-text-secondary">
          {record.stockingLogic}
        </p>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <DetailRow label={t("detail.stockWeeks")} value={record.supplyMetrics.stockWeeks} />
          <DetailRow
            label={t("detail.stockMode")}
            value={t(`stockMode.${record.supplyMetrics.stockMode}`)}
          />
          <DetailRow
            label={t("detail.leadTime")}
            value={`${record.supplyMetrics.leadTimeDays}${t("detail.days")}`}
          />
          <DetailRow
            label={t("detail.coverage")}
            value={`${record.platformCoverage}/${record.platformTotal}`}
          />
        </dl>

        <SpecConsensusPanel
          primarySpec={record.primarySpec}
          consensusSpec={record.specProfile.consensusSpec}
          primarySpecs={record.specProfile.primarySpecs}
          forms={record.specProfile.forms}
          notes={record.specProfile.notes}
        />

        {blends.length > 0 && (
          <div className="space-y-1.5">
            {blends.map((b) => (
              <p key={b.id} className="text-[11px] text-command-text-muted">
                <span className="font-medium text-command-teal-bright">{b.name}</span>
                {" · "}
                {b.components.map((c) => `${c.product} ${c.amount}`).join(" + ")}
              </p>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowPlatforms((v) => !v)}
          className="flex w-full items-center gap-1.5 text-[11px] font-medium text-command-teal-bright"
        >
          {showPlatforms ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {t("coverage.title")} ({record.platformCoverage}/{record.platformTotal})
        </button>
        {showPlatforms && <PlatformCoverageMap record={record} />}

        {record.regulatoryNotes.length > 0 && (
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
        )}
      </div>
    </aside>
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
