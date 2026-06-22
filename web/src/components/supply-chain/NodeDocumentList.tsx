"use client";

import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DocStatus, DocumentRecord } from "@/lib/supply-chain/types";

const statusVariant: Record<
  DocStatus,
  "optimal" | "delayed" | "critical" | "stable" | "default"
> = {
  valid: "optimal",
  expiring_soon: "delayed",
  expired: "critical",
  missing: "critical",
  pending: "default",
};

interface NodeDocumentListProps {
  documents: DocumentRecord[];
}

export function NodeDocumentList({ documents }: NodeDocumentListProps) {
  const t = useTranslations("supplyChain");

  if (documents.length === 0) {
    return (
      <p className="text-xs text-command-text-muted">{t("documents.noDocsForNode")}</p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="rounded-lg border border-command-border bg-command-card-elevated p-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-command-text">
                {t(`docTypes.${doc.docType}` as "docTypes.gmp_cert")}
              </p>
              {doc.linkedProduct && (
                <p className="mt-0.5 text-[10px] text-command-text-muted">
                  {doc.linkedProduct}
                </p>
              )}
            </div>
            <StatusBadge variant={statusVariant[doc.status]}>
              {t(`docStatus.${doc.status}`)}
            </StatusBadge>
          </div>
          {(doc.expiryDate || doc.gapNote) && (
            <p className="mt-1.5 text-[10px] text-command-text-muted">
              {doc.expiryDate && (
                <span>
                  {t("documents.expiry")}: {doc.expiryDate}
                </span>
              )}
              {doc.gapNote && (
                <span className="mt-0.5 block text-command-orange">{doc.gapNote}</span>
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
