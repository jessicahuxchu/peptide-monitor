"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { riskColor } from "@/lib/supply-chain/utils";

export type PathBranch = "shared" | "primary" | "alternative" | "high_risk" | "patient";

export interface UnifiedNode {
  id: string;
  label: string;
  roleKey?: string;
  region?: string;
  branch: PathBranch;
  riskLevel: "low" | "medium" | "high";
  roleId?: string;
}

const SHARED_NODES: UnifiedNode[] = [
  { id: "u1", label: "中国多肽工厂", roleKey: "cnManufacturer", region: "CN", branch: "shared", riskLevel: "low", roleId: "role-manufacturer-cn" },
  { id: "u2", label: "出口商", roleKey: "cnExporter", region: "CN-SH", branch: "shared", riskLevel: "low", roleId: "role-exporter-cn" },
  { id: "u3", label: "国际货代", roleKey: "freightForwarder", region: "CN→AU", branch: "shared", riskLevel: "medium", roleId: "role-freight" },
  { id: "u4", label: "澳洲报关", roleKey: "auCustomsBroker", region: "VIC/NSW", branch: "shared", riskLevel: "medium", roleId: "role-customs-au" },
];

const BRANCH_NODES: Record<"primary" | "alternative" | "high_risk", UnifiedNode[]> = {
  primary: [
    { id: "p1", label: "进口许可", roleKey: "importPermitHolder", region: "AU", branch: "primary", riskLevel: "medium", roleId: "role-import-permit" },
    { id: "p2", label: "保税仓", roleKey: "bondedWarehouse", region: "VIC", branch: "primary", riskLevel: "low", roleId: "role-warehouse" },
    { id: "p3", label: "检测实验室", roleKey: "testingLab", region: "VIC", branch: "primary", riskLevel: "low", roleId: "role-lab" },
    { id: "p4", label: "配制药房", roleKey: "compoundingPharmacy", region: "AU", branch: "primary", riskLevel: "medium", roleId: "role-compounding" },
    { id: "p5", label: "批发商", roleKey: "wholesaleDistributor", region: "AU", branch: "primary", riskLevel: "low", roleId: "role-wholesale" },
    { id: "p6", label: "B2B 客户", roleKey: "b2bCustomer", region: "VIC", branch: "primary", riskLevel: "low" },
  ],
  alternative: [
    { id: "a1", label: "配制药房", roleKey: "compoundingPharmacy", region: "AU", branch: "alternative", riskLevel: "medium", roleId: "role-compounding" },
    { id: "a2", label: "处方医生", roleKey: "prescriber", region: "VIC", branch: "alternative", riskLevel: "medium", roleId: "role-doctor" },
    { id: "a3", label: "诊所", roleKey: "clinic", region: "VIC", branch: "alternative", riskLevel: "low", roleId: "role-clinic" },
  ],
  high_risk: [
    { id: "h1", label: "快递直邮", roleKey: "expressCourier", region: "CN→AU", branch: "high_risk", riskLevel: "high", roleId: "role-freight" },
    { id: "h2", label: "灰色零售", roleKey: "greyRetail", region: "AU Online", branch: "high_risk", riskLevel: "high", roleId: "role-grey-retail" },
  ],
};

const PATIENT_NODE: UnifiedNode = {
  id: "patient",
  label: "患者",
  roleKey: "patient",
  region: "AU",
  branch: "patient",
  riskLevel: "low",
  roleId: "role-patient",
};

const branchStyles: Record<PathBranch, { border: string; bg: string; line: string; label: string }> = {
  shared: { border: "border-command-border", bg: "bg-command-card-elevated", line: "bg-command-border", label: "text-command-text-muted" },
  primary: { border: "border-command-teal/50", bg: "bg-command-teal/5", line: "bg-command-teal/60", label: "text-command-teal-bright" },
  alternative: { border: "border-blue-500/50", bg: "bg-blue-500/5", line: "bg-blue-500/60", label: "text-blue-400" },
  high_risk: { border: "border-command-orange/50", bg: "bg-command-orange/5", line: "bg-command-orange/60", label: "text-command-orange" },
  patient: { border: "border-command-green/50", bg: "bg-command-green/10", line: "bg-command-green/60", label: "text-command-green" },
};

interface UnifiedPathMapProps {
  selectedNodeId: string | null;
  onSelectNode: (id: string, roleId?: string) => void;
}

function NodeCard({
  node,
  isSelected,
  onClick,
  compact,
}: {
  node: UnifiedNode;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const t = useTranslations("supplyChain");
  const style = branchStyles[node.branch];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col rounded-lg border text-left transition-all",
        compact ? "p-1.5" : "p-2",
        style.border,
        style.bg,
        isSelected && "ring-2 ring-command-teal/50 shadow-[0_0_12px_rgba(20,184,166,0.15)]",
      )}
    >
      <span
        className={cn(
          "mb-0.5 w-fit rounded px-1 py-0.5 text-[8px] font-semibold uppercase",
          riskColor(node.riskLevel),
        )}
      >
        {t(`risk.${node.riskLevel}`)}
      </span>
      <span className={cn("font-semibold leading-tight text-command-text", compact ? "text-[10px]" : "text-[11px]")}>
        {node.roleKey ? t(`roles.${node.roleKey}`) : node.label}
      </span>
      {node.region && (
        <span className="mt-0.5 text-[9px] text-command-text-muted">{node.region}</span>
      )}
    </button>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center text-command-text-muted", className)}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <path d="M2 6h7M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function UnifiedPathMap({ selectedNodeId, onSelectNode }: UnifiedPathMapProps) {
  const t = useTranslations("supplyChain");

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-[10px]">
        {(["primary", "alternative", "high_risk"] as const).map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", branchStyles[b].line)} />
            <span className={branchStyles[b].label}>{t(`paths.${b === "primary" ? "b2bCompounding" : b === "alternative" ? "clinicPrescriber" : "greyRetail"}`)}</span>
          </span>
        ))}
      </div>

      {/* Shared trunk */}
      <div className="mb-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
          {t("unifiedMap.sharedTrunk")}
        </p>
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {SHARED_NODES.map((node, i) => (
            <div key={node.id} className="flex min-w-0 flex-1 items-center gap-1 sm:max-w-[22%]">
              <NodeCard
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => onSelectNode(node.id, node.roleId)}
                compact
              />
              {i < SHARED_NODES.length - 1 && <Arrow className="hidden sm:flex" />}
            </div>
          ))}
        </div>
      </div>

      {/* Branch point */}
      <div className="mb-2 flex justify-center">
        <div className="h-4 w-px bg-command-border sm:h-6" />
      </div>

      {/* Three branches */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["primary", "alternative", "high_risk"] as const).map((branchKey) => {
          const nodes = BRANCH_NODES[branchKey];
          const style = branchStyles[branchKey];
          return (
            <div
              key={branchKey}
              className={cn("rounded-xl border p-2 sm:p-3", style.border, style.bg)}
            >
              <p className={cn("mb-2 text-[10px] font-semibold uppercase tracking-wider", style.label)}>
                {t(`paths.${branchKey === "primary" ? "b2bCompounding" : branchKey === "alternative" ? "clinicPrescriber" : "greyRetail"}`)}
              </p>
              <div className="flex flex-col gap-1.5">
                {nodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onClick={() => onSelectNode(node.id, node.roleId)}
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Converge to patient */}
      <div className="mb-2 flex justify-center">
        <div className="flex items-center gap-2 text-[10px] text-command-text-muted">
          <div className="h-px w-8 bg-command-border" />
          <span>{t("unifiedMap.converge")}</span>
          <div className="h-px w-8 bg-command-border" />
        </div>
      </div>

      <div className="mx-auto max-w-xs">
        <NodeCard
          node={PATIENT_NODE}
          isSelected={selectedNodeId === PATIENT_NODE.id}
          onClick={() => onSelectNode(PATIENT_NODE.id, PATIENT_NODE.roleId)}
        />
      </div>
    </div>
  );
}

export { SHARED_NODES, BRANCH_NODES, PATIENT_NODE };
