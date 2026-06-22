"use client";

import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSupplyChainStore } from "@/hooks/useSupplyChainStore";
import { docStatusColor } from "@/lib/supply-chain/utils";
import { cn } from "@/lib/utils";

const statusOrder = ["missing", "expired", "expiring_soon", "pending", "valid"];

export default function DocumentsPage() {
  const t = useTranslations();
  const { state, hydrated } = useSupplyChainStore();
  const docs = [...state.documents].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );

  const counts = docs.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (!hydrated) {
    return <div className="p-6 text-sm text-command-text-muted">Loading…</div>;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <CommandCard title={t("pages.documents.title")} subtitle={t("pages.documents.description")}>
        <div className="mb-6 flex flex-wrap gap-2">
          {statusOrder.map((status) =>
            counts[status] ? (
              <StatusBadge key={status} variant={docStatusColor(status)}>
                {t(`docStatus.${status}`)} · {counts[status]}
              </StatusBadge>
            ) : null,
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-command-border text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                <th className="pb-3 pr-4">{t("documentsPage.type")}</th>
                <th className="pb-3 pr-4">{t("documentsPage.product")}</th>
                <th className="pb-3 pr-4">{t("documentsPage.status")}</th>
                <th className="pb-3 pr-4">{t("documentsPage.expiry")}</th>
                <th className="pb-3">{t("documentsPage.gap")}</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr
                  key={doc.id}
                  className={cn(
                    "border-b border-command-border/50",
                    doc.status === "missing" && "bg-command-red/5",
                    doc.status === "expiring_soon" && "bg-command-orange/5",
                  )}
                >
                  <td className="py-3 pr-4 font-medium">
                    {t(`docTypes.${doc.docType}`)}
                  </td>
                  <td className="py-3 pr-4 text-command-teal-bright">{doc.linkedProduct}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge variant={docStatusColor(doc.status)}>
                      {t(`docStatus.${doc.status}`)}
                    </StatusBadge>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-command-text-secondary">
                    {doc.expiryDate ?? "—"}
                  </td>
                  <td className="py-3 text-xs text-command-text-secondary">
                    {doc.gapNote ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CommandCard>
    </div>
  );
}
