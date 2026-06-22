"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDbResource } from "@/hooks/useDbResource";
import { regulatoryEntries as fallbackRegulatory } from "@/lib/supply-chain/seed-data";
import type { RiskLevel } from "@/lib/supply-chain/types";
import { cn } from "@/lib/utils";

const riskVariant: Record<RiskLevel, "optimal" | "delayed" | "critical"> = {
  low: "optimal",
  medium: "delayed",
  high: "critical",
};

export function RegulatoryMatrixView() {
  const t = useTranslations("regulatoryMatrix");
  const { data: regulatoryEntries } = useDbResource(
    "/api/regulatory",
    fallbackRegulatory,
  );
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const markets = [...new Set(regulatoryEntries.map((r) => r.market))];

  const filtered =
    marketFilter === "all"
      ? regulatoryEntries
      : regulatoryEntries.filter((r) => r.market === marketFilter);

  const selected = regulatoryEntries.find((r) => r.id === selectedId);

  return (
    <div className="grid gap-4 p-4 md:gap-5 md:p-6 lg:grid-cols-[1fr_320px]">
      <CommandCard title={t("title")} subtitle={t("subtitle")}>
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterBtn
            active={marketFilter === "all"}
            onClick={() => setMarketFilter("all")}
            label={t("allMarkets")}
          />
          {markets.map((m) => (
            <FilterBtn
              key={m}
              active={marketFilter === m}
              onClick={() => setMarketFilter(m)}
              label={m}
            />
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-command-border text-xs text-command-text-muted">
                <th className="pb-2 pr-3 font-medium">{t("market")}</th>
                <th className="pb-2 pr-3 font-medium">{t("region")}</th>
                <th className="pb-2 pr-3 font-medium">{t("product")}</th>
                <th className="pb-2 pr-3 font-medium">{t("body")}</th>
                <th className="pb-2 pr-3 font-medium">{t("classification")}</th>
                <th className="pb-2 font-medium">{t("risk")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={cn(
                    "cursor-pointer border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/50",
                    selectedId === entry.id && "bg-command-teal/5",
                  )}
                >
                  <td className="py-2.5 pr-3 font-medium text-command-teal-bright">
                    {entry.market}
                  </td>
                  <td className="py-2.5 pr-3 text-command-text-secondary">{entry.region}</td>
                  <td className="py-2.5 pr-3 text-command-text">{entry.product}</td>
                  <td className="py-2.5 pr-3 text-command-text-secondary">
                    {entry.regulatoryBody}
                  </td>
                  <td className="max-w-[180px] truncate py-2.5 pr-3 text-xs text-command-text-muted">
                    {entry.classification}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge variant={riskVariant[entry.riskLevel]}>
                      {entry.riskLevel.toUpperCase()}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CommandCard>

      {selected && (
        <CommandCard title={t("detailTitle")} className="h-fit lg:sticky lg:top-20">
          <div className="space-y-3 text-sm">
            <DetailRow label={t("market")} value={`${selected.market} · ${selected.region}`} />
            <DetailRow label={t("body")} value={selected.regulatoryBody} />
            <DetailRow label={t("classification")} value={selected.classification} />
            <div>
              <p className="mb-1.5 text-xs text-command-text-muted">{t("requirements")}</p>
              <ul className="space-y-1">
                {selected.requirements.map((req) => (
                  <li
                    key={req}
                    className="flex items-start gap-1.5 text-command-text-secondary"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-command-teal" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            <DetailRow label={t("lastUpdated")} value={selected.lastUpdated} />
            <DetailRow label={t("source")} value={selected.source} />
          </div>
        </CommandCard>
      )}
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-command-teal/40 bg-command-teal/10 text-command-teal-bright"
          : "border-command-border text-command-text-muted",
      )}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-command-text-muted">{label}</p>
      <p className="text-command-text-secondary">{value}</p>
    </div>
  );
}
