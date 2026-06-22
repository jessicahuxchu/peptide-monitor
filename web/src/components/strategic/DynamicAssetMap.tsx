"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { mapNodes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function DynamicAssetMap() {
  const t = useTranslations("map");
  const [view, setView] = useState<"map" | "sat" | "docs">("map");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <CommandCard
      title={t("title")}
      subtitle={t("corridor")}
      className="min-h-[420px] flex-1"
      action={
        <div className="flex gap-3 text-[11px] font-medium uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setView(view === "sat" ? "map" : "sat")}
            className={cn(
              "transition-colors",
              view === "sat"
                ? "text-command-teal-bright"
                : "text-command-text-muted hover:text-command-text-secondary",
            )}
          >
            {t("satView")}
          </button>
          <button
            type="button"
            onClick={() => setView(view === "docs" ? "map" : "docs")}
            className={cn(
              "transition-colors",
              view === "docs"
                ? "text-command-teal-bright"
                : "text-command-text-muted hover:text-command-text-secondary",
            )}
          >
            {t("docs")}
          </button>
        </div>
      }
    >
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-lg border border-command-border",
          view === "sat" ? "bg-[#0d1117]" : "grid-map-bg bg-[#050505]",
        )}
        style={{ minHeight: "340px" }}
      >
        {view === "docs" ? (
          <div className="flex h-full min-h-[340px] flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm text-command-text-secondary">
              Document Tracker
            </p>
            <p className="text-xs text-command-text-muted">
              GMP · COA · Import Permit · TGA Approval
            </p>
            <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2">
              {["GMP Certificate", "COA", "Import Permit", "TGA Approval"].map(
                (doc) => (
                  <div
                    key={doc}
                    className="rounded-lg border border-command-border bg-command-card-elevated px-3 py-2 text-xs text-command-text-secondary"
                  >
                    {doc}
                  </div>
                ),
              )}
            </div>
          </div>
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Corridor path */}
            <line
              x1="50"
              y1="22"
              x2="50"
              y2="78"
              stroke="#2a2a2a"
              strokeWidth="0.3"
              strokeDasharray="1.5 1.5"
            />

            {/* Animated transit segment */}
            <line
              x1="50"
              y1="22"
              x2="50"
              y2="50"
              stroke="#14b8a6"
              strokeWidth="0.4"
              strokeDasharray="1 1"
              opacity="0.6"
            />
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="78"
              stroke="#f97316"
              strokeWidth="0.4"
              strokeDasharray="1 1"
              opacity="0.6"
            />

            {/* Decorative landmass shapes */}
            <ellipse
              cx="30"
              cy="20"
              rx="18"
              ry="10"
              fill="#111"
              stroke="#2a2a2a"
              strokeWidth="0.2"
            />
            <ellipse
              cx="72"
              cy="82"
              rx="20"
              ry="12"
              fill="#111"
              stroke="#2a2a2a"
              strokeWidth="0.2"
            />

            {mapNodes.map((node) => {
              const isTransit = node.status === "transit";
              const isHovered = hoveredNode === node.id;
              const color = isTransit ? "#f97316" : "#14b8a6";

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer"
                >
                  {isHovered && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="4"
                      fill="none"
                      stroke={color}
                      strokeWidth="0.3"
                      opacity="0.5"
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? 2.2 : 1.8}
                    fill={color}
                    style={{
                      filter: `drop-shadow(0 0 ${isHovered ? 6 : 4}px ${color})`,
                    }}
                  />
                  <text
                    x={node.x + (node.id === "shanghai" ? 4 : node.id === "sydney" ? 4 : -4)}
                    y={node.y + (node.id === "shanghai" ? -3 : node.id === "sydney" ? 5 : 0)}
                    textAnchor={node.id === "transit" ? "end" : "start"}
                    fill="#ffffff"
                    fontSize="2.8"
                    fontWeight="500"
                  >
                    {t(node.labelKey)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {view === "sat" && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        )}
      </div>
    </CommandCard>
  );
}
