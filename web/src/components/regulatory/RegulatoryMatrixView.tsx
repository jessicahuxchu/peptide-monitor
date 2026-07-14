"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  COMPLIANCE_MATRIX_V6,
  type MatrixCellV6,
  type MatrixRowV6,
  type SourceStatusRow,
} from "@/lib/regulatory/compliance-matrix-v6";
import {
  getSourceDisplay,
  localizeFramework,
  localizeJurisdiction,
  localizeMatrixCell,
  localizeRegionHandling,
  riskLevelLabel,
  type MatrixLocale,
} from "@/lib/regulatory/matrix-i18n";
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

/** Fixed body-cell height so classification tiles look uniform. */
const MATRIX_CELL_H = "h-[5.25rem]";

export function RegulatoryMatrixView() {
  const t = useTranslations("regulatoryMatrix");
  const locale = (useLocale() === "zh" ? "zh" : "en") as MatrixLocale;
  const [country, setCountry] = useState<CountryId>("au");
  const [tab, setTab] = useState<TabId>("matrix");
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceStatusRow | null>(null);

  const { matrixRows, stateFramework, sources } = COMPLIANCE_MATRIX_V6;

  const showSidebar =
    country === "au" &&
    ((tab === "matrix" && selected !== null) ||
      (tab === "framework" && selectedSource !== null));

  function selectCountry(next: CountryId) {
    setCountry(next);
    setSelected(null);
    setSelectedSource(null);
  }

  function selectTab(next: TabId) {
    setTab(next);
    setSelected(null);
    setSelectedSource(null);
  }

  function selectSource(source: SourceStatusRow) {
    setSelectedSource(source);
  }

  return (
    <div
      className={cn(
        "grid w-full max-w-full gap-4 overflow-x-hidden p-4 md:gap-5 md:p-6",
        showSidebar && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
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
                  <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-command-border">
                        <th className="sticky left-0 z-10 w-[132px] bg-command-bg pb-2 pr-2 font-medium text-command-text-muted">
                          {t("product")}
                        </th>
                        {REGULATORY_COLUMNS.map((col) => (
                          <th
                            key={col}
                            className="pb-2 pr-2 font-medium text-command-text-muted"
                          >
                            {localizeJurisdiction(col, locale, t("federalBaseline"))}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-command-border/60 bg-command-card-elevated/25">
                        <td className="sticky left-0 z-10 bg-command-bg py-2 pr-2 align-top font-medium text-command-text-muted">
                          {t("operationalConsequence")}
                        </td>
                        {REGULATORY_COLUMNS.map((col) => (
                          <td key={`handling-${col}`} className="py-2 pr-2 align-top">
                            <p className="text-[10px] leading-snug text-command-text-secondary">
                              {localizeRegionHandling(col, locale)}
                            </p>
                          </td>
                        ))}
                      </tr>
                      {matrixRows.map((row) => (
                        <tr key={row.product} className="border-b border-command-border/40">
                          <td className="sticky left-0 z-10 bg-command-bg py-1.5 pr-2 align-middle">
                            <p className="font-semibold leading-snug text-command-teal-bright">
                              {row.product}
                            </p>
                          </td>
                          {REGULATORY_COLUMNS.map((col) => (
                            <MatrixCell
                              key={`${row.product}-${col}`}
                              row={row}
                              column={col}
                              cell={row.cells[col]}
                              locale={locale}
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
                        <th className="pb-2 pr-2">{t("difference")}</th>
                        <th className="pb-2 pr-2">{t("operationalConsequence")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stateFramework.map((raw) => {
                        const sf = localizeFramework(raw, locale);
                        const rowSources = sources.filter(
                          (s) => s.jurisdiction === raw.jurisdiction,
                        );
                        const isActive = selectedSource?.jurisdiction === raw.jurisdiction;
                        return (
                          <tr
                            key={raw.jurisdiction}
                            className={cn(
                              "border-b border-command-border/40",
                              isActive && "bg-command-teal/5",
                            )}
                          >
                            <td className="py-2 pr-2 font-medium text-command-teal-bright">
                              {localizeJurisdiction(
                                raw.jurisdiction,
                                locale,
                                t("federalBaseline"),
                              )}
                            </td>
                            <td className="py-2 pr-2 text-command-text-secondary">
                              {sf.regulator}
                            </td>
                            <td className="max-w-[240px] py-2 pr-2">
                              <div className="flex flex-col gap-1">
                                {rowSources.length === 0 ? (
                                  <span className="text-command-text-muted">—</span>
                                ) : (
                                  rowSources.map((s) => {
                                    const display = getSourceDisplay(s, locale);
                                    const active =
                                      selectedSource?.jurisdiction === s.jurisdiction &&
                                      selectedSource?.source === s.source;
                                    return (
                                      <button
                                        key={`${s.jurisdiction}-${s.source}`}
                                        type="button"
                                        onClick={() => selectSource(s)}
                                        className={cn(
                                          "text-left text-xs underline-offset-2 transition-colors hover:underline",
                                          active
                                            ? "font-medium text-command-teal-bright"
                                            : "text-command-teal-bright/90 hover:text-command-teal-bright",
                                        )}
                                      >
                                        {display.name}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-command-text-secondary">
                              {sf.difference}
                            </td>
                            <td className="max-w-[180px] py-2 pr-2 text-command-text-muted">
                              {sf.action}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            <ReviewStatusBadge
              status={getSourceDisplay(selectedSource, locale).reviewStatus}
              t={t}
            />
            <p className="mt-2 text-[10px] text-command-text-muted">
              {getSourceDisplay(selectedSource, locale).purpose}
            </p>
          </div>
          <SourceDocumentPanel
            source={selectedSource}
            locale={locale}
            title={t("sourceExcerptTitle")}
            annotationLabel={t("sourceAnnotations")}
            openUrlLabel={t("openOfficialSource")}
            federalLabel={t("federalBaseline")}
          />
        </CommandCard>
      ) : selected ? (
        <CommandCard
          title={t("detailTitle")}
          className="h-fit min-w-0 overflow-hidden lg:sticky lg:top-20"
        >
          <div className="space-y-3 overflow-hidden text-sm">
            {(() => {
              const cell = localizeMatrixCell(selected.cell, locale);
              return (
                <>
                  <p className="break-words text-xs text-command-teal-bright">
                    {selected.row.product} ·{" "}
                    {localizeJurisdiction(selected.region, locale, t("federalBaseline"))}
                  </p>
                  <DetailRow label={t("body")} value={cell.regulator} />
                  <DetailRow label={t("classification")} value={cell.classification} />
                  <div>
                    <p className="mb-1 text-xs text-command-text-muted">{t("risk")}</p>
                    <RiskLabelBadge label={selected.cell.riskLabel} locale={locale} />
                  </div>
                  <DetailRow
                    label={t("operationalConsequence")}
                    value={localizeRegionHandling(selected.region, locale)}
                  />
                </>
              );
            })()}
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
  locale,
  onSelect,
  t,
}: {
  row: MatrixRowV6;
  column: RegulatoryColumn;
  cell?: MatrixCellV6;
  locale: MatrixLocale;
  onSelect: (sel: SelectedCell) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!cell) {
    return (
      <td className={cn("p-1.5 align-middle text-command-text-muted", MATRIX_CELL_H)}>
        <div
          className={cn(
            "flex h-full items-center rounded-lg border border-command-border/40 px-2",
            MATRIX_CELL_H,
          )}
        >
          {column === "Federal" ? "—" : t("inheritsFederal")}
        </div>
      </td>
    );
  }

  const localized = localizeMatrixCell(cell, locale);

  return (
    <td className="p-1.5 align-middle">
      <button
        type="button"
        onClick={() => onSelect({ row, region: column, cell })}
        className={cn(
          "flex w-full flex-col justify-between rounded-lg border p-2 text-left transition-colors hover:border-command-teal/40",
          MATRIX_CELL_H,
          cell.isIncremental
            ? "border-command-orange/30 bg-command-orange/5"
            : "border-command-border bg-command-card-elevated/40",
        )}
      >
        <p className="line-clamp-2 text-[10px] leading-snug text-command-text-secondary">
          {localized.classification}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <RiskLabelBadge label={cell.riskLabel} locale={locale} compact />
          {cell.isIncremental && (
            <span className="text-[9px] text-command-orange">{t("stateDelta")}</span>
          )}
        </div>
      </button>
    </td>
  );
}

function RiskLabelBadge({
  label,
  locale,
  compact,
}: {
  label: string;
  locale: MatrixLocale;
  compact?: boolean;
}) {
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
        {riskLevelLabel(level, locale, true)}
      </span>
    );
  }

  return (
    <StatusBadge variant={riskVariant[level]}>
      {locale === "zh" ? riskLevelLabel(level, locale) : label}
    </StatusBadge>
  );
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
