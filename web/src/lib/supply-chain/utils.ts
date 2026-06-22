import type { NodeType, PathNode, RiskLevel, SupplyChainState } from "./types";

export interface KpiSnapshot {
  feasiblePaths: number;
  totalActivePaths: number;
  docCompletion: number;
  openAlerts: number;
  topSku: string;
}

export function calcPathDocumentCompletionFromState(
  state: SupplyChainState,
  pathId: string,
): number {
  const nodes = state.nodes
    .filter((n) => n.pathId === pathId)
    .sort((a, b) => a.sequence - b.sequence);
  if (nodes.length === 0) return 0;
  const total = nodes.reduce((sum, n) => sum + n.documentCompletion, 0);
  return Math.round(total / nodes.length);
}

export function calcOverallKpisFromState(
  state: SupplyChainState,
  openAlertCount: number,
  topSku = "BPC-157",
): KpiSnapshot {
  const activePaths = state.paths.filter((p) => p.pathType !== "high_risk");
  const feasiblePaths = activePaths.filter(
    (p) => calcPathDocumentCompletionFromState(state, p.id) >= 60,
  );
  const allDocs = state.documents;
  const docCompletion =
    allDocs.length === 0
      ? 0
      : Math.round(
          (allDocs.filter((d) => d.status === "valid").length / allDocs.length) *
            100,
        );

  return {
    feasiblePaths: feasiblePaths.length,
    totalActivePaths: activePaths.length,
    docCompletion,
    openAlerts: openAlertCount,
    topSku,
  };
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "text-command-green border-command-green/40 bg-command-green/10";
    case "medium":
      return "text-command-orange border-command-orange/40 bg-command-orange/10";
    case "high":
      return "text-command-red border-command-red/40 bg-command-red/10";
  }
}

export function riskDotColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-command-green";
    case "medium":
      return "bg-command-orange";
    case "high":
      return "bg-command-red";
  }
}

export function docStatusColor(
  status: string,
): "optimal" | "delayed" | "stable" | "default" {
  switch (status) {
    case "valid":
      return "optimal";
    case "expiring_soon":
      return "delayed";
    case "missing":
    case "expired":
      return "stable";
    default:
      return "default";
  }
}

export function getNodeDocuments(
  nodeId: string,
  documents: { linkedNodeId?: string; docType: string; status: string }[],
) {
  return documents.filter((d) => d.linkedNodeId === nodeId);
}

export function formatNodeType(nodeType: NodeType, t: (key: string) => string) {
  return t(`nodeTypes.${nodeType}`);
}

export function nodeLabel(node: PathNode, t: (key: string) => string) {
  return node.displayName || formatNodeType(node.nodeType, t);
}
