"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { useSupplyChainStore } from "@/hooks/useSupplyChainStore";
import { supplyChainState } from "@/lib/supply-chain/seed-data";
import { supplyChainRoles } from "@/lib/supply-chain/role-data";
import { CommandCard } from "@/components/ui/CommandCard";
import { UnifiedPathMap } from "./UnifiedPathMap";
import { RoleCompanyView } from "./RoleCompanyView";
import { FeasibilityScore } from "./FeasibilityScore";
import { DocumentTracker } from "./DocumentTracker";
import { riskColor } from "@/lib/supply-chain/utils";
import { cn } from "@/lib/utils";

type Tab = "map" | "roles" | "documents";

export function SupplyChainView() {
  const t = useTranslations("supplyChain");
  const { state, hydrated, usingDb, error, resetToSeed } = useSupplyChainStore();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedUnifiedNodeId, setSelectedUnifiedNodeId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("map");

  const selectedRole = supplyChainRoles.find((r) => r.id === selectedRoleId);

  const pathNodes = useMemo(
    () =>
      state.nodes
        .filter((n) => n.pathId === supplyChainState.paths[0].id)
        .sort((a, b) => a.sequence - b.sequence),
    [state.nodes],
  );

  const pathEdges = useMemo(
    () => state.edges.filter((e) => e.pathId === supplyChainState.paths[0].id),
    [state.edges],
  );

  if (!hydrated) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-command-text-muted">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      {!usingDb && hydrated && (
        <p className="mb-4 rounded-lg border border-command-orange/30 bg-command-orange/5 px-4 py-2 text-xs text-command-orange">
          {t("offlineMode")}
        </p>
      )}
      {error && <p className="mb-4 text-xs text-command-red">{error}</p>}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-full border border-command-border bg-command-card p-1">
          {(["map", "roles", "documents"] as Tab[]).map((t_key) => (
            <button
              key={t_key}
              type="button"
              onClick={() => setTab(t_key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                tab === t_key
                  ? "bg-command-card-elevated text-command-teal-bright"
                  : "text-command-text-secondary hover:text-command-text",
              )}
            >
              {t(`tabs.${t_key}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={resetToSeed}
          className="flex items-center gap-1.5 rounded-full border border-command-border px-3 py-1.5 text-[11px] text-command-text-muted transition-colors hover:border-command-teal/30 hover:text-command-text-secondary"
        >
          <RotateCcw className="h-3 w-3" />
          {t("resetSeed")}
        </button>
      </div>

      {tab === "documents" ? (
        <DocumentTracker
          documents={state.documents}
          nodes={state.nodes.map((n) => ({ id: n.id, displayName: n.displayName }))}
        />
      ) : tab === "roles" ? (
        <RoleCompanyView
          selectedRoleId={selectedRoleId}
          onSelectRole={setSelectedRoleId}
        />
      ) : (
        <div className="grid w-full max-w-full gap-4 xl:grid-cols-[1fr_260px]">
          <div className="min-w-0 space-y-4">
            <CommandCard title={t("unifiedMap.title")} subtitle={t("unifiedMap.subtitle")}>
              <UnifiedPathMap
                selectedNodeId={selectedUnifiedNodeId}
                onSelectNode={(nodeId, roleId) => {
                  setSelectedUnifiedNodeId(nodeId);
                  if (roleId) setSelectedRoleId(roleId);
                }}
              />
            </CommandCard>

            <CommandCard title={t("rolesSection.title")}>
              <RoleCompanyView
                selectedRoleId={selectedRoleId}
                onSelectRole={setSelectedRoleId}
              />
            </CommandCard>
          </div>

          <div className="min-w-0 space-y-4">
            <FeasibilityScore nodes={pathNodes} edges={pathEdges} />
            {selectedRole ? (
              <div className="overflow-hidden rounded-xl border border-command-border bg-command-card-elevated p-4">
                <h3 className="mb-3 text-sm font-semibold text-command-text">
                  {t("rolesSection.roleDetail")}
                </h3>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-command-text-muted">{t("nodeDetail.region")}</dt>
                    <dd>{selectedRole.country} · {selectedRole.region}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-command-text-muted">{t("nodeDetail.docCompletion")}</dt>
                    <dd className="tabular-nums">{selectedRole.documentCompletion}%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-command-text-muted">{t("nodeEdit.riskLevel")}</dt>
                    <dd>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", riskColor(selectedRole.riskLevel))}>
                        {t(`risk.${selectedRole.riskLevel}`)}
                      </span>
                    </dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                    {t("documents.title")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedRole.requiredDocuments.map((doc) => (
                      <span
                        key={doc}
                        className="rounded border border-command-border px-1.5 py-0.5 text-[10px] text-command-text-secondary"
                      >
                        {t(`docTypes.${doc}`)}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedRole.riskNotes && (
                  <p className="mt-3 rounded-lg border border-command-orange/30 bg-command-orange/5 px-3 py-2 text-[11px] text-command-orange">
                    {selectedRole.riskNotes}
                  </p>
                )}
              </div>
            ) : (
              <CommandCard>
                <p className="text-sm text-command-text-muted">{t("selectNodeHint")}</p>
              </CommandCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
