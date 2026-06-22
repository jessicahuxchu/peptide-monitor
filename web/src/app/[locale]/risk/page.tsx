"use client";

import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDbResource } from "@/hooks/useDbResource";
import { useSupplyChainStore } from "@/hooks/useSupplyChainStore";
import { riskSignals as fallbackRiskSignals } from "@/lib/supply-chain/seed-data";
import { cn } from "@/lib/utils";

const severityStyle = {
  critical: "border-command-red/40 bg-command-red/10 text-command-red",
  high: "border-command-orange/40 bg-command-orange/10 text-command-orange",
  medium: "border-command-orange/20 bg-command-orange/5 text-command-orange",
  low: "border-command-border bg-command-card-elevated text-command-text-secondary",
};

export default function RiskPage() {
  const t = useTranslations();
  const { data: riskSignals } = useDbResource("/api/risk", fallbackRiskSignals);
  const { state } = useSupplyChainStore();
  const nodeMap = Object.fromEntries(
    state.nodes.map((n) => [n.id, n.displayName]),
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      <CommandCard title={t("pages.risk.title")} subtitle={t("pages.risk.description")}>
        <div className="grid gap-3 md:grid-cols-2">
          {riskSignals.map((signal) => (
            <article
              key={signal.id}
              className={cn(
                "rounded-xl border p-4",
                severityStyle[signal.severity],
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {t(`riskTypes.${signal.type}`)}
                </span>
                <span className="text-[10px] font-semibold uppercase">
                  {signal.severity}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{t(signal.titleKey)}</h3>
              <p className="mt-1 text-xs leading-relaxed opacity-90">
                {t(signal.bodyKey)}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {signal.affectedNodes.map((nodeId) => (
                  <span
                    key={nodeId}
                    className="rounded-full border border-current/20 px-2 py-0.5 text-[10px]"
                  >
                    {nodeMap[nodeId] ?? nodeId}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10px] uppercase opacity-70">
                {t(`riskStatus.${signal.status}`)}
              </p>
            </article>
          ))}
        </div>
      </CommandCard>
    </div>
  );
}
