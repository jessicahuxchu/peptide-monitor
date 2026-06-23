"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { useSupplyChainStore } from "@/hooks/useSupplyChainStore";
import { PATH_PRIMARY } from "@/lib/supply-chain/seed-data";
import { getChainNodeOverrides, formedChains } from "@/lib/supply-chain/role-data";
import { CommandCard } from "@/components/ui/CommandCard";
import { PathFlowMap } from "./PathFlowMap";
import { PathSelector } from "./PathSelector";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { NodeEditDialog } from "./NodeEditDialog";
import { RoleCompanyView } from "./RoleCompanyView";
import { FeasibilityScore } from "./FeasibilityScore";
export function SupplyChainView() {
  const t = useTranslations("supplyChain");
  const { state, hydrated, usingDb, error, resetToSeed, updateNode } =
    useSupplyChainStore();

  const [activePathId, setActivePathId] = useState(PATH_PRIMARY);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [editNodeId, setEditNodeId] = useState<string | null>(null);

  const nodes = useMemo(
    () =>
      state.nodes
        .filter((n) => n.pathId === activePathId)
        .sort((a, b) => a.sequence - b.sequence),
    [state.nodes, activePathId],
  );

  const edges = useMemo(
    () => state.edges.filter((e) => e.pathId === activePathId),
    [state.edges, activePathId],
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const incomingEdge = selectedNode
    ? edges.find((e) => e.toNodeId === selectedNode.id)
    : undefined;
  const editNode = state.nodes.find((n) => n.id === editNodeId);
  const nodeDocuments = useMemo(
    () =>
      selectedNodeId
        ? state.documents.filter((d) => d.linkedNodeId === selectedNodeId)
        : [],
    [state.documents, selectedNodeId],
  );

  const chainOverrides = useMemo(() => {
    if (!selectedChainId) return undefined;
    const formed = formedChains.find((c) => c.id === selectedChainId);
    if (!formed) return undefined;
    return getChainNodeOverrides(formed, nodes);
  }, [selectedChainId, nodes]);

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

      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={resetToSeed}
          className="flex items-center gap-1.5 rounded-full border border-command-border px-3 py-1.5 text-[11px] text-command-text-muted transition-colors hover:border-command-teal/30 hover:text-command-text-secondary"
        >
          <RotateCcw className="h-3 w-3" />
          {t("resetSeed")}
        </button>
      </div>

      <div className="grid w-full max-w-full gap-4 xl:grid-cols-[1fr_280px]">
        <CommandCard title={t("mapTitle")} subtitle={t("selectNodeHint")}>
          <PathSelector
            paths={state.paths}
            activePathId={activePathId}
            onChange={(pathId) => {
              setActivePathId(pathId);
              setSelectedNodeId(null);
              setSelectedRoleId(null);
              setSelectedChainId(null);
            }}
          />
          <div className="mt-4 overflow-hidden rounded-lg border border-command-border grid-map-bg bg-[#050505] p-4">
            <PathFlowMap
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              roleOnly
              chainOverrides={chainOverrides}
            />
          </div>

          <div className="mt-6 border-t border-command-border pt-6">
            <RoleCompanyView
              activePathId={activePathId}
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
              selectedChainId={selectedChainId}
              onSelectChain={setSelectedChainId}
            />
          </div>
        </CommandCard>

        <div className="min-w-0 space-y-4">
          <FeasibilityScore nodes={nodes} edges={edges} />
          {selectedNode ? (
            <div className="overflow-hidden rounded-xl border border-command-border">
              <NodeDetailPanel
                node={selectedNode}
                incomingEdge={incomingEdge}
                nodeDocuments={nodeDocuments}
                onClose={() => setSelectedNodeId(null)}
                onEdit={() => setEditNodeId(selectedNode.id)}
              />
            </div>
          ) : (
            <CommandCard>
              <p className="text-sm text-command-text-muted">
                {t("selectNodeHint")}
              </p>
            </CommandCard>
          )}
        </div>
      </div>

      {editNode && (
        <NodeEditDialog
          node={editNode}
          onSave={(updates) => {
            updateNode(editNode.id, updates);
            setEditNodeId(null);
          }}
          onClose={() => setEditNodeId(null)}
        />
      )}
    </div>
  );
}
