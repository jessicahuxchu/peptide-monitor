"use client";

import { useTranslations } from "next-intl";
import { X, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NodeDocumentList } from "./NodeDocumentList";
import type { DocumentRecord, PathEdge, PathNode } from "@/lib/supply-chain/types";
import { cn } from "@/lib/utils";

interface NodeDetailPanelProps {
  node: PathNode;
  incomingEdge?: PathEdge;
  nodeDocuments?: DocumentRecord[];
  onClose: () => void;
  onEdit: () => void;
}

export function NodeDetailPanel({
  node,
  incomingEdge,
  nodeDocuments = [],
  onClose,
  onEdit,
}: NodeDetailPanelProps) {
  const t = useTranslations("supplyChain");

  const statusVariant =
    node.riskLevel === "low"
      ? "optimal"
      : node.riskLevel === "medium"
        ? "delayed"
        : "critical";

  return (
    <aside className="flex h-full flex-col border-l border-command-border bg-command-card">
      <div className="flex items-center justify-between border-b border-command-border p-4">
        <h3 className="text-sm font-semibold text-command-text">{t("nodeDetail.title")}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-1.5 text-command-text-muted transition-colors hover:bg-command-card-elevated hover:text-command-teal"
            aria-label={t("nodeDetail.edit")}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-command-text-muted transition-colors hover:bg-command-card-elevated hover:text-command-text"
            aria-label={t("nodeDetail.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-xs text-command-teal-bright">{t(`nodeTypes.${node.nodeType}`)}</p>
          <p className="mt-1 text-base font-semibold text-command-text">{node.displayName}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={statusVariant}>{t(`risk.${node.riskLevel}`)}</StatusBadge>
          <StatusBadge variant="default">{t(`status.${node.status}`)}</StatusBadge>
        </div>

        {node.region && (
          <Row label={t("nodeDetail.region")} value={node.region} />
        )}
        {node.roleDescription && (
          <Row label={t("nodeDetail.role")} value={node.roleDescription} />
        )}
        {node.entityName && (
          <Row label={t("nodeDetail.entity")} value={node.entityName} />
        )}

        <div>
          <p className="mb-1.5 text-xs text-command-text-muted">{t("nodeDetail.docCompletion")}</p>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-command-border">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  node.documentCompletion >= 70
                    ? "bg-command-teal"
                    : node.documentCompletion >= 40
                      ? "bg-command-orange"
                      : "bg-command-red",
                )}
                style={{ width: `${node.documentCompletion}%` }}
              />
            </div>
            <span className="text-sm font-medium text-command-text">
              {node.documentCompletion}%
            </span>
          </div>
        </div>

        {incomingEdge && (
          <div className="rounded-lg border border-command-border bg-command-card-elevated p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-command-text-muted">
              {t("nodeDetail.incomingEdge")}
            </p>
            <div className="space-y-1 text-xs text-command-text-secondary">
              <p>{t(`transport.${incomingEdge.transportMode}`)} · {incomingEdge.estimatedDays}d</p>
              {incomingEdge.incoterms && <p>Incoterms: {incomingEdge.incoterms}</p>}
              {incomingEdge.requiredDocuments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {incomingEdge.requiredDocuments.map((doc) => (
                    <span
                      key={doc}
                      className="rounded bg-command-border px-1.5 py-0.5 text-[10px]"
                    >
                      {t(`docTypes.${doc}` as "docTypes.gmp_cert")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {node.notes && (
          <div>
            <p className="mb-1 text-xs text-command-text-muted">{t("nodeDetail.notes")}</p>
            <p className="text-sm text-command-text-secondary">{node.notes}</p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-command-text-muted">
            {t("documents.title")}
          </p>
          <NodeDocumentList documents={nodeDocuments} />
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-command-text-muted">{label}</p>
      <p className="text-sm text-command-text-secondary">{value}</p>
    </div>
  );
}
