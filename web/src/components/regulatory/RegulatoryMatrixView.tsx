"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  COMPLIANCE_MATRIX_V6,
  type MatrixCellV6,
  type MatrixRowV6,
  type SourceStatusRow,
  type StateFrameworkRow,
} from "@/lib/regulatory/compliance-matrix-v6";
import { REGULATORY_COLUMNS, type RegulatoryColumn } from "@/lib/regulatory/matrix";
import type { RiskLevel } from "@/lib/supply-chain/types";
import { cn } from "@/lib/utils";
import { SourceDocumentPanel } from "./SourceDocumentPanel";

type CountryId = "au" | "us";
type TabId = "matrix" | "framework";

interface SelectedCell {
  row: MatrixRowV6;
  region: string;
  cell: MatrixCellV6;
}

const riskVariant: Record<RiskLevel, "optimal" | "delayed" | "critical"> = {
  low: "optimal",
  medium: "delayed",
  high: "critical",
};

const TABS: TabId[] = ["matrix", "framework"];
const COUNTRIES: CountryId[] = ["au", "us"];

export function RegulatoryMatrixView() {
  const t = useTranslations("regulatoryMatrix");
  const [country, setCountry] = useState<CountryId>("au");
  const [tab, setTab] = useState<TabId>("matrix");
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceStatusRow | null>(null);

  const { matrixRows, stateFramework, sources } = COMPLIANCE_MATRIX_V6;

  const jurisdictionSources = useMemo(() => {
    if (!selectedJurisdiction) return [];
    return sources.filter((s) => s.jurisdiction === selectedJurisdiction);
  }, [selectedJurisdiction, sources]);

  const showSidebar =
    country === "au" &&
    ((tab === "matrix" && selected !== null) ||
      (tab === "framework" && selectedSource !== null));

  function selectCountry(next: CountryId) {
    setCountry(next);
    setSelected(null);
    setSelectedJurisdiction(null);
    setSelectedSource(null);
  }

  function selectTab(next: TabId) {
    setTab(next);
    setSelected(null);
    setSelectedJurisdiction(null);
    setSelectedSource(null);
  }

  function selectFrameworkRow(sf: StateFrameworkRow) {
    setSelectedJurisdiction(sf.jurisdiction);
    const matched = sources.filter((s) => s.jurisdiction === sf.jurisdiction);
    setSelectedSource(matched[0] ?? null);
  }

  return (
    <div
      className={cn(
        "grid w-full max-w-full gap-4 overflow-x-hidden p-4 md:gap-5 md:p-6",
        showSidebar && "lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]",
      )}
    >
      <div className="min-w-0 space-y-4">
        <CommandCard className="border-0 bg-transparent p-0 shadow-none">
          <div className="mb-3 flex flex-wrap gap-1">
            {COUNTRIES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => selectCountry(id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  country === id
                    ? "bg-command-teal/15 text-command-teal-bright"
                    : "text-command-text-muted hover:text-command-text-secondary",
                )}
              >
                {t(`country.${id}`)}
              </button>
            ))}
          </div>

          {country === "us" ? (
            <div className="rounded-lg border border-command-border bg-command-card-elevated/40 p-6">
              <p className="text-sm font-medium text-command-teal-bright">
                {t("usPlaceholderTitle")}
              </p>
              <p className="mt-2 text-xs text-command-text-muted">{t("usPlaceholderBody")}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-1 border-b border-command-border pb-2">
                {TABS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTab(id)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      tab === id
                        ? "bg-command-teal/15 text-command-teal-bright"
                        : "text-command-text-muted hover:text-command-text-secondary",
                    )}
                  >
                    {t(`tabs.${id}`)}
                  </button>
                ))}
              </div>

              {tab === "matrix" && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-command-border">
                        <th className="sticky left-0 z-10 min-w-[140px] bg-command-bg pb-2 pr-3 font-medium text-command-text-muted">
                          {t("product")}
                        </th>
                        {REGULATORY_COLUMNS.map((col) => (
                          <th
                            key={col}
                            className="min-w-[110px] pb-2 pr-2 font-medium text-command-text-muted"
                          >
                            {col === "Federal" ? t("federalBaseline") : col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((row) => (
                        <tr key={row.product} className="border-b border-command-border/40">
                          <td className="sticky left-0 z-10 bg-command-bg py-2 pr-3 align-top">
                            <p className="font-semibold text-command-teal-bright">{row.product}</p>
                          </td>
                          {REGULATORY_COLUMNS.map((col) => (
                            <MatrixCell
                              key={`${row.product}-${col}`}
                              row={row}
                              column={col}
                              cell={row.cells[col]}
                              onSelect={setSelected}
                              t={t}
                            />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === "framework" && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-command-border text-command-text-muted">
                        <th className="pb-2 pr-2">{t("jurisdiction")}</th>
                        <th className="pb-2 pr-2">{t("body")}</th>
                        <th className="pb-2 pr-2">{t("legalBasis")}</th>
                        <th className="pb-2 pr-2">{t("stateOverlay")}</th>
                        <th className="pb-2 pr-2">{t("difference")}</th>
                        <th className="pb-2 pr-2">{t("operationalConsequence")}</th>
                        <th className="pb-2 pr-2">{t("source")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stateFramework.map((sf) => {
                        const rowSources = sources.filter(
                          (s) => s.jurisdiction === sf.jurisdiction,
                        );
                        const isActive = selectedJurisdiction === sf.jurisdiction;
                        return (
                          <tr
                            key={sf.jurisdiction}
                            className={cn(
                              "cursor-pointer border-b border-command-border/40 transition-colors hover:bg-command-card-elevated/40",
                              isActive && "bg-command-teal/5",
                            )}
                            onClick={() => selectFrameworkRow(sf)}
                          >
                            <td className="py-2 pr-2 font-medium text-command-teal-bright">
                              {sf.jurisdiction === "Federal"
                                ? t("federalBaseline")
                                : sf.jurisdiction}
                            </td>
                            <td className="py-2 pr-2 text-command-text-secondary">
                              {sf.regulator}
                            </td>
                            <td className="max-w-[200px] py-2 pr-2 text-command-text-secondary">
                              {sf.legalBasis}
                            </td>
                            <td className="py-2 pr-2 text-command-text-secondary">
                              {sf.incrementalClassification}
                            </td>
                            <td className="py-2 pr-2 text-command-text-secondary">
                              {sf.difference}
                            </td>
                            <td className="max-w-[180px] py-2 pr-2 text-command-text-muted">
                              {sf.action}
                            </td>
                            <td className="max-w-[160px] py-2 pr-2 text-command-text-muted">
                              {rowSources.length > 0
                                ? rowSources.map((s) => s.source).join("；")
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {selectedJurisdiction && jurisdictionSources.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="mr-1 self-center text-[10px] text-command-text-muted">
                        {t("sourcesForJurisdiction")}:
                      </span>
                      {jurisdictionSources.map((s) => (
                        <button
                          key={`${s.jurisdiction}-${s.source}`}
                          type="button"
                          onClick={() => setSelectedSource(s)}
                          className={cn(
                            "rounded-md px-2 py-1 text-[10px] transition-colors",
                            selectedSource?.source === s.source
                              ? "bg-command-teal/15 text-command-teal-bright"
                              : "bg-command-card-elevated text-command-text-muted hover:text-command-text-secondary",
                          )}
                        >
                          {s.source}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CommandCard>
      </div>

      {tab === "framework" && selectedSource ? (
        <CommandCard
          title={t("sourceDocumentTitle")}
          className="h-fit min-w-0 overflow-hidden lg:sticky lg:top-20"
        >
          <div className="mb-3">
            <ReviewStatusBadge status={selectedSource.reviewStatus} t={t} />
            <p className="mt-2 text-[10px] text-command-text-muted">{selectedSource.purpose}</p>
          </div>
          <SourceDocumentPanel
            source={selectedSource}
            title={t("sourceExcerptTitle")}
            annotationLabel={t("sourceAnnotations")}
            openUrlLabel={t("openOfficialSource")}
          />
        </CommandCard>
      ) : selected ? (
        <CommandCard
          title={t("detailTitle")}
          className="h-fit min-w-0 overflow-hidden lg:sticky lg:top-20"
        >
          <div className="space-y-3 overflow-hidden text-sm">
            <p className="break-words text-xs text-command-teal-bright">
              {selected.row.product} ·{" "}
              {selected.region === "Federal" ? t("federalBaseline") : selected.region}
            </p>
            <DetailRow label={t("body")} value={selected.cell.regulator} />
            <DetailRow label={t("classification")} value={selected.cell.classification} />
            <div>
              <p className="mb-1 text-xs text-command-text-muted">{t("risk")}</p>
              <RiskLabelBadge label={selected.cell.riskLabel} />
            </div>
            <DetailRow
              label={t("operationalConsequence")}
              value={selected.cell.operationalConsequence}
            />
            {selected.cell.basisRef && (
              <DetailRow label={t("basisRef")} value={selected.cell.basisRef} />
            )}
          </div>
        </CommandCard>
      ) : null}
    </div>
  );
}

function MatrixCell({
  row,
  column,
  cell,
  onSelect,
  t,
}: {
  row: MatrixRowV6;
  column: RegulatoryColumn;
  cell?: MatrixCellV6;
  onSelect: (sel: SelectedCell) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!cell) {
    return (
      <td className="py-2 pr-2 text-command-text-muted">
        {column === "Federal" ? "—" : t("inheritsFederal")}
      </td>
    );
  }

  return (
    <td className="py-2 pr-2 align-top">
      <button
        type="button"
        onClick={() => onSelect({ row, region: column, cell })}
        className={cn(
          "w-full rounded-lg border p-2 text-left transition-colors hover:border-command-teal/40",
          cell.isIncremental
            ? "border-command-orange/30 bg-command-orange/5"
            : "border-command-border bg-command-card-elevated/40",
        )}
      >
        <p className="line-clamp-2 text-[10px] text-command-text-secondary">
          {cell.classification}
        </p>
        <div className="mt-1.5">
          <RiskLabelBadge label={cell.riskLabel} compact />
        </div>
        <p className="mt-1 line-clamp-2 text-[9px] text-command-text-muted">
          {cell.operationalConsequence}
        </p>
        {cell.isIncremental && (
          <span className="mt-1 inline-block text-[9px] text-command-orange">
            {t("stateDelta")}
          </span>
        )}
      </button>
    </td>
  );
}

function RiskLabelBadge({ label, compact }: { label: string; compact?: boolean }) {
  let level: RiskLevel = "medium";
  if (label.includes("绿")) level = "low";
  else if (label.includes("橙")) level = "medium";
  else if (label.includes("红")) level = "high";

  if (compact) {
    return (
      <span
        className={cn(
          "inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold",
          level === "low" && "bg-command-green/15 text-command-green",
          level === "medium" &&
            "bg-command-orange/20 text-command-orange ring-1 ring-command-orange/40",
          level === "high" && "bg-command-red/25 text-command-red ring-1 ring-command-red/50",
        )}
      >
        {level === "low" ? "Low" : level === "medium" ? "Med" : "High"}
      </span>
    );
  }

  return <StatusBadge variant={riskVariant[level]}>{label}</StatusBadge>;
}

function ReviewStatusBadge({
  status,
  t,
}: {
  status: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const pending = status.includes("待") || status.toLowerCase().includes("pending");
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px]",
        pending
          ? "bg-command-orange/10 text-command-orange"
          : "bg-command-teal/10 text-command-teal-bright",
      )}
    >
      {pending ? t("reviewPending") : status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-command-text-muted">{label}</p>
      <p className="break-words text-sm text-command-text-secondary">{value}</p>
    </div>
  );
}
