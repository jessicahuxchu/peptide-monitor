import type { PathEdge, PathNode, RiskLevel } from "./types";

const RISK_FACTOR: Record<RiskLevel, number> = {
  low: 1,
  medium: 0.7,
  high: 0.4,
};

export function calcFeasibilityScore(
  nodes: PathNode[],
  edges: PathEdge[],
): { score: number; docCompletion: number; riskFactor: number; edgeRisk: number } {
  if (nodes.length === 0) {
    return { score: 0, docCompletion: 0, riskFactor: 0, edgeRisk: 0 };
  }

  const docCompletion =
    nodes.reduce((sum, n) => sum + n.documentCompletion, 0) / nodes.length;

  const nodeRisk =
    nodes.reduce((sum, n) => sum + RISK_FACTOR[n.riskLevel], 0) / nodes.length;

  const edgeRisk =
    edges.length > 0
      ? edges.reduce((sum, e) => sum + RISK_FACTOR[e.riskLevel], 0) / edges.length
      : 1;

  const score = Math.round(
    (docCompletion / 100) * nodeRisk * edgeRisk * 100,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    docCompletion: Math.round(docCompletion),
    riskFactor: Math.round(nodeRisk * 100),
    edgeRisk: Math.round(edgeRisk * 100),
  };
}

export function getScoreLabel(score: number): "optimal" | "moderate" | "critical" {
  if (score >= 70) return "optimal";
  if (score >= 40) return "moderate";
  return "critical";
}
