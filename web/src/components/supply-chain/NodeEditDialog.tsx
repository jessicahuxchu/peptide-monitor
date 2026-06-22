"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PathNode, RiskLevel, NodeStatus } from "@/lib/supply-chain/types";

interface NodeEditDialogProps {
  node: PathNode;
  onSave: (updates: Partial<PathNode>) => void;
  onClose: () => void;
}

export function NodeEditDialog({ node, onSave, onClose }: NodeEditDialogProps) {
  const t = useTranslations("supplyChain");
  const [displayName, setDisplayName] = useState(node.displayName);
  const [region, setRegion] = useState(node.region ?? "");
  const [roleDescription, setRoleDescription] = useState(node.roleDescription ?? "");
  const [entityName, setEntityName] = useState(node.entityName ?? "");
  const [notes, setNotes] = useState(node.notes ?? "");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(node.riskLevel);
  const [status, setStatus] = useState<NodeStatus>(node.status);
  const [documentCompletion, setDocumentCompletion] = useState(node.documentCompletion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      displayName,
      region: region || undefined,
      roleDescription: roleDescription || undefined,
      entityName: entityName || undefined,
      notes: notes || undefined,
      riskLevel,
      status,
      documentCompletion,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-command-border bg-command-card p-5 shadow-2xl"
      >
        <h3 className="mb-4 text-base font-semibold text-command-text">
          {t("nodeEdit.title")}
        </h3>

        <div className="space-y-3">
          <Field label={t("nodeEdit.displayName")}>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              required
            />
          </Field>
          <Field label={t("nodeEdit.region")}>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="input-field"
            />
          </Field>
          <Field label={t("nodeEdit.role")}>
            <input
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              className="input-field"
            />
          </Field>
          <Field label={t("nodeEdit.entity")}>
            <input
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              className="input-field"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("nodeEdit.riskLevel")}>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="input-field"
              >
                <option value="low">{t("risk.low")}</option>
                <option value="medium">{t("risk.medium")}</option>
                <option value="high">{t("risk.high")}</option>
              </select>
            </Field>
            <Field label={t("nodeEdit.status")}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NodeStatus)}
                className="input-field"
              >
                <option value="active">{t("status.active")}</option>
                <option value="inactive">{t("status.inactive")}</option>
                <option value="blocked">{t("status.blocked")}</option>
              </select>
            </Field>
          </div>
          <Field label={`${t("nodeEdit.docCompletion")} (${documentCompletion}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={documentCompletion}
              onChange={(e) => setDocumentCompletion(Number(e.target.value))}
              className="w-full accent-command-teal"
            />
          </Field>
          <Field label={t("nodeEdit.notes")}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field resize-none"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-command-border px-4 py-2 text-xs font-medium text-command-text-secondary hover:border-command-teal/30"
          >
            {t("nodeEdit.cancel")}
          </button>
          <button
            type="submit"
            className="rounded-full bg-command-teal px-4 py-2 text-xs font-semibold text-black hover:bg-command-teal-bright"
          >
            {t("nodeEdit.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-command-text-muted">{label}</span>
      {children}
    </label>
  );
}
