"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { NodeType, PathEdge, PathNode } from "@/lib/supply-chain/types";
import type { ChainNodeOverride } from "@/lib/supply-chain/role-data";
import { riskColor, riskDotColor } from "@/lib/supply-chain/utils";
import { cn } from "@/lib/utils";

interface PathFlowMapProps {
  nodes: PathNode[];
  edges: PathEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  compact?: boolean;
  typeFilter?: NodeType | "all";
  /** When true, show role label only until a chain is selected. */
  roleOnly?: boolean;
  /** Per-node company + doc completion when a formed chain is active. */
  chainOverrides?: Map<string, ChainNodeOverride>;
}

const NODE_W = { compact: 128, normal: 148 } as const;
const CONN_W = { compact: 24, normal: 32 } as const;

export function PathFlowMap({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  compact = false,
  typeFilter = "all",
  roleOnly = false,
  chainOverrides,
}: PathFlowMapProps) {
  const t = useTranslations();

  const visibleNodes =
    typeFilter === "all"
      ? nodes
      : nodes.filter((n) => n.nodeType === typeFilter);

  const nodeW = compact ? NODE_W.compact : NODE_W.normal;
  const connW = compact ? CONN_W.compact : CONN_W.normal;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [rows, setRows] = useState<number[][]>([visibleNodes.map((_, i) => i)]);

  useLayoutEffect(() => {
    const measure = () => {
      const grouped: number[][] = [];
      let currentRow: number[] = [];
      let prevTop: number | null = null;

      for (let i = 0; i < visibleNodes.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const top = el.offsetTop;
        if (prevTop !== null && top > prevTop + 2) {
          if (currentRow.length > 0) grouped.push(currentRow);
          currentRow = [];
        }
        currentRow.push(i);
        prevTop = top;
      }
      if (currentRow.length > 0) grouped.push(currentRow);
      if (grouped.length > 0) setRows(grouped);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [visibleNodes]);

  const renderNode = (node: PathNode, dimmed: boolean) => {
    const override = chainOverrides?.get(node.id);
    const isSelected = selectedNodeId === node.id;
    const showCompany = Boolean(override?.companyName);
    const showDocBar = showCompany || !roleOnly;
    const title = showCompany
      ? override!.companyName
      : roleOnly
        ? `${t(`nodeTypes.${node.nodeType}`)}${node.optional ? "*" : ""}`
        : node.displayName;
    const docPct = override?.documentCompletion ?? node.documentCompletion;

    return (
      <button
        type="button"
        onClick={() => onSelectNode(node.id)}
        className={cn(
          "group relative flex flex-col rounded-xl border text-left transition-all duration-150",
          compact ? "w-[128px] p-2.5" : "w-[148px] p-3",
          isSelected
            ? "border-command-teal bg-command-teal/10 shadow-[0_0_16px_rgba(20,184,166,0.15)]"
            : "border-command-border bg-command-card-elevated hover:border-command-teal/30",
          dimmed && "opacity-40",
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
            showCompany && "text-command-teal-bright",
          )}
        >
          {title}
        </p>

        {(showCompany || !roleOnly) && (
          <p className="mt-1 text-[10px] text-command-teal-bright">
            {t(`nodeTypes.${node.nodeType}`)}
            {node.optional ? "*" : ""}
          </p>
        )}

        {node.region && (
          <p className="mt-0.5 text-[10px] text-command-text-muted">{node.region}</p>
        )}

        {showDocBar && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-command-border">
              <div
                className="h-full rounded-full bg-command-teal transition-all"
                style={{ width: `${docPct}%` }}
              />
            </div>
            <span className="text-[9px] tabular-nums text-command-text-muted">
              {docPct}%
            </span>
          </div>
        )}
      </button>
    );
  };

  const renderHorizontalConnector = (fromNodeId: string) => {
    const edge = edges.find((e) => e.fromNodeId === fromNodeId);
    return (
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
    );
  };

  const renderRowBridge = (prevRowIndices: number[], nextRowIndices: number[]) => {
    const lastIdx = prevRowIndices[prevRowIndices.length - 1];
    const firstIdx = nextRowIndices[0];
    const lastNode = visibleNodes[lastIdx];
    const edge = edges.find((e) => e.fromNodeId === lastNode.id);
    const lastNodeCenter = (prevRowIndices.length - 1) * (nodeW + connW) + nodeW / 2;
    const firstNodeCenter = nodeW / 2;
    const bridgeWidth = Math.max(0, lastNodeCenter - firstNodeCenter);

    return (
      <div className="relative h-8 w-full" aria-hidden>
        <div
          className="absolute top-0 h-3 w-px bg-command-border"
          style={{ left: lastNodeCenter }}
        />
        <div
          className="absolute top-3 h-px bg-command-border"
          style={{ left: firstNodeCenter, width: bridgeWidth }}
        />
        <div
          className="absolute top-3 h-3 w-px bg-command-border"
          style={{ left: firstNodeCenter }}
        />
        <div
          className={cn(
            "absolute top-2.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
            edge ? riskDotColor(edge.riskLevel) : "bg-command-border",
          )}
          style={{ left: lastNodeCenter }}
        />
        <span className="sr-only">
          {lastNode.id} → {visibleNodes[firstIdx].id}
        </span>
      </div>
    );
  };

  return (
    <div className={cn("relative px-1", compact ? "py-2" : "py-4")}>
      {/* Invisible probe — same width as parent for wrap detection */}
      <div
        ref={containerRef}
        className="invisible absolute inset-x-0 top-0 flex flex-wrap items-center gap-y-3"
        aria-hidden
      >
        {visibleNodes.map((node, index) => (
          <div
            key={`measure-${node.id}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="flex items-center"
          >
            <div className={cn(compact ? "h-[1px] w-[128px]" : "h-[1px] w-[148px]")} />
            {index < visibleNodes.length - 1 && (
              <div className={cn(compact ? "w-6" : "w-8")} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-0">
        {rows.map((rowIndices, rowIdx) => (
          <Fragment key={rowIdx}>
            {rowIdx > 0 && renderRowBridge(rows[rowIdx - 1], rowIndices)}
            <div className="flex items-center">
              {rowIndices.map((nodeIndex, posInRow) => {
                const node = visibleNodes[nodeIndex];
                const dimmed =
                  typeFilter !== "all" && node.nodeType !== typeFilter;
                return (
                  <div key={node.id} className="flex items-center">
                    {renderNode(node, dimmed)}
                    {posInRow < rowIndices.length - 1 &&
                      renderHorizontalConnector(node.id)}
                  </div>
                );
              })}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
