"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PathFlowMap } from "@/components/supply-chain/PathFlowMap";
import { PathSelector } from "@/components/supply-chain/PathSelector";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDashboard } from "@/components/providers/DashboardProvider";
import { PATH_PRIMARY } from "@/lib/supply-chain/seed-data";
import { ArrowRight } from "lucide-react";

export function StrategicMapPreview() {
  const t = useTranslations("map");
  const { data } = useDashboard();
  const [activePathId, setActivePathId] = useState(PATH_PRIMARY);

  const nodes = useMemo(
    () =>
      data.supplyChain.nodes
        .filter((n) => n.pathId === activePathId)
        .sort((a, b) => a.sequence - b.sequence),
    [data.supplyChain.nodes, activePathId],
  );
  const edges = useMemo(
    () => data.supplyChain.edges.filter((e) => e.pathId === activePathId),
    [data.supplyChain.edges, activePathId],
  );

  return (
    <div className="flex min-h-[50vh] flex-col">
      <CommandCard title={t("title")} className="min-h-[280px] flex-1">
        <PathSelector
          paths={data.supplyChain.paths}
          activePathId={activePathId}
          onChange={setActivePathId}
        />
        <div className="mt-3 overflow-hidden rounded-lg border border-command-border grid-map-bg bg-[#050505]">
          <PathFlowMap
            nodes={nodes}
            edges={edges}
            selectedNodeId={null}
            onSelectNode={() => {}}
            compact
          />
        </div>
      </CommandCard>
      <div className="mt-3 flex justify-end">
        <Link
          href="/supply-chain"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-command-teal-bright transition-colors hover:text-command-teal"
        >
          {t("openFullMap")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
