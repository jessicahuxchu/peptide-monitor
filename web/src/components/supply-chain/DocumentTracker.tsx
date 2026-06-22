"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DocStatus, DocumentRecord } from "@/lib/supply-chain/types";
import { cn } from "@/lib/utils";

interface DocumentTrackerProps {
  documents: DocumentRecord[];
  nodes: { id: string; displayName: string }[];
}

const statusVariant: Record<DocStatus, "optimal" | "delayed" | "critical" | "stable" | "default"> = {
  valid: "optimal",
  expiring_soon: "delayed",
  expired: "critical",
  missing: "critical",
  pending: "default",
};

export function DocumentTracker({ documents, nodes }: DocumentTrackerProps) {
  const t = useTranslations("supplyChain");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "all">("all");

  const nodeMap = new Map(nodes.map((n) => [n.id, n.displayName]));

  const filtered =
    statusFilter === "all"
      ? documents
      : documents.filter((d) => d.status === statusFilter);

  const counts = documents.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <CommandCard title={t("documents.title")} subtitle={t("documents.subtitle")}>
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          label={`${t("documents.all")} (${documents.length})`}
        />
        {(["valid", "expiring_soon", "expired", "missing", "pending"] as DocStatus[]).map(
          (s) =>
            counts[s] ? (
              <FilterChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                label={`${t(`docStatus.${s}`)} (${counts[s]})`}
              />
            ) : null,
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-command-border text-xs text-command-text-muted">
              <th className="pb-2 pr-4 font-medium">{t("documents.type")}</th>
              <th className="pb-2 pr-4 font-medium">{t("documents.product")}</th>
              <th className="pb-2 pr-4 font-medium">{t("documents.linkedNode")}</th>
              <th className="pb-2 pr-4 font-medium">{t("documents.status")}</th>
              <th className="pb-2 font-medium">{t("documents.expiry")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-command-border/50 transition-colors hover:bg-command-card-elevated/50"
              >
                <td className="py-2.5 pr-4 text-command-text">
                  {t(`docTypes.${doc.docType}` as "docTypes.gmp_cert")}
                </td>
                <td className="py-2.5 pr-4 text-command-text-secondary">{doc.linkedProduct}</td>
                <td className="max-w-[160px] truncate py-2.5 pr-4 text-xs text-command-text-muted">
                  {doc.linkedNodeId ? nodeMap.get(doc.linkedNodeId) ?? "—" : "—"}
                </td>
                <td className="py-2.5 pr-4">
                  <StatusBadge variant={statusVariant[doc.status]}>
                    {t(`docStatus.${doc.status}`)}
                  </StatusBadge>
                </td>
                <td className="py-2.5 text-xs text-command-text-muted">
                  {doc.expiryDate ?? "—"}
                  {doc.gapNote && (
                    <p className="mt-0.5 text-command-orange">{doc.gapNote}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CommandCard>
  );
}

function FilterChip({
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
          : "border-command-border text-command-text-muted hover:text-command-text-secondary",
      )}
    >
      {label}
    </button>
  );
}
