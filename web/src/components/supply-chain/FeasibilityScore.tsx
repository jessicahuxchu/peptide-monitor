"use client";

import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { calcFeasibilityScore, getScoreLabel } from "@/lib/supply-chain/feasibility";
import type { PathEdge, PathNode } from "@/lib/supply-chain/types";

interface FeasibilityScoreProps {
  nodes: PathNode[];
  edges: PathEdge[];
}

export function FeasibilityScore({ nodes, edges }: FeasibilityScoreProps) {
  const t = useTranslations("supplyChain");
  const { score, docCompletion, riskFactor } = calcFeasibilityScore(nodes, edges);
  const label = getScoreLabel(score);

  const badgeVariant =
    label === "optimal" ? "optimal" : label === "moderate" ? "delayed" : "critical";

  return (
    <CommandCard title={t("feasibility.title")}>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold text-command-text">{score}</span>
        <StatusBadge variant={badgeVariant}>{t(`feasibility.${label}`)}</StatusBadge>
      </div>
      <div className="mt-4 space-y-2 border-t border-command-border pt-3">
        <div className="flex justify-between text-xs">
          <span className="text-command-text-muted">{t("feasibility.docCompletion")}</span>
          <span className="text-command-text-secondary">{docCompletion}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-command-border">
          <div
            className="h-full rounded-full bg-command-teal transition-all"
            style={{ width: `${docCompletion}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-command-text-muted">{t("feasibility.riskFactor")}</span>
          <span className="text-command-text-secondary">{riskFactor}%</span>
        </div>
      </div>
    </CommandCard>
  );
}
