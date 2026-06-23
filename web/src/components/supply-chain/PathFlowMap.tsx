"use client";

import { useTranslations } from "next-intl";
import type { NodeType, PathEdge, PathNode } from "@/lib/supply-chain/types";
import { riskColor, riskDotColor } from "@/lib/supply-chain/utils";
import { cn } from "@/lib/utils";

interface PathFlowMapProps {
  nodes: PathNode[];
  edges: PathEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  compact?: boolean;
  typeFilter?: NodeType | "all";
  /** When true, show role label only (hide company / display name). */
  roleOnly?: boolean;
}

export function PathFlowMap({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  compact = false,
  typeFilter = "all",
  roleOnly = false,
}: PathFlowMapProps) {
  const t = useTranslations();

  const visibleNodes =
    typeFilter === "all"
      ? nodes
      : nodes.filter((n) => n.nodeType === typeFilter);

  return (
    <div className={cn("px-1", compact ? "py-2" : "py-4")}>
      <div className="flex flex-wrap items-center gap-y-3">
        {visibleNodes.map((node, index) => {
          const edge = edges.find((e) => e.fromNodeId === node.id);
          const isSelected = selectedNodeId === node.id;
          const dimmed = typeFilter !== "all" && node.nodeType !== typeFilter;

          return (
            <div
              key={node.id}
              className={cn("flex items-center", dimmed && "opacity-40")}
            >
              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                className={cn(
                  "group relative flex flex-col rounded-xl border text-left transition-all duration-150",
                  compact ? "w-[128px] p-2.5" : "w-[148px] p-3",
                  isSelected
                    ? "border-command-teal bg-command-teal/10 shadow-[0_0_16px_rgba(20,184,166,0.15)]"
                    : "border-command-border bg-command-card-elevated hover:border-command-teal/30",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                      riskColor(node.riskLevel),
                    )}
                  >
                    {t(`riskLevels.${node.riskLevel}`)}
                  </span>
                  <span className="text-[10px] font-medium text-command-text-muted">
                    #{node.sequence}
                  </span>
                </div>

                <p
                  className={cn(
                    "font-semibold leading-snug text-command-text",
                    compact ? "text-[11px]" : "text-xs",
                  )}
                >
                  {roleOnly
                    ? `${t(`nodeTypes.${node.nodeType}`)}${node.optional ? "*" : ""}`
                    : node.displayName}
                </p>

                {!roleOnly && (
                  <p className="mt-1 text-[10px] text-command-teal-bright">
                    {t(`nodeTypes.${node.nodeType}`)}
                  </p>
                )}

                {node.region && (
                  <p className="mt-0.5 text-[10px] text-command-text-muted">
                    {node.region}
                  </p>
                )}

                <div className="mt-2.5 flex items-center gap-1.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-command-border">
                    <div
                      className="h-full rounded-full bg-command-teal transition-all"
                      style={{ width: `${node.documentCompletion}%` }}
                    />
                  </div>
                  <span className="text-[9px] tabular-nums text-command-text-muted">
                    {node.documentCompletion}%
                  </span>
                </div>
              </button>

              {index < visibleNodes.length - 1 && (
                <div
                  className={cn(
                    "flex shrink-0 flex-col items-center justify-center px-0.5",
                    compact ? "w-6" : "w-8",
                  )}
                >
                  <div className="relative h-px w-full bg-command-border">
                    <div
                      className={cn(
                        "absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                        edge ? riskDotColor(edge.riskLevel) : "bg-command-border",
                      )}
                    />
                  </div>
                  {edge && !compact && (
                    <span className="mt-1 text-center text-[9px] leading-tight text-command-text-muted">
                      {edge.estimatedDays}d · {t(`transport.${edge.transportMode}`)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
