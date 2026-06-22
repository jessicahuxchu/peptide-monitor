"use client";

import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDashboard } from "@/components/providers/DashboardProvider";
import { agentInsights as fallbackInsights } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const accentStyles = {
  orange: "border-l-command-orange bg-command-orange/5",
  teal: "border-l-command-teal bg-command-teal/5",
  red: "border-l-command-red bg-command-red/5",
};

export function AgentInsights() {
  const t = useTranslations("insights");
  const { data } = useDashboard();
  const agentInsights =
    (data.config.agent_insights as typeof fallbackInsights | null) ??
    fallbackInsights;

  return (
    <CommandCard title={t("title")} className="flex-1">
      <div className="space-y-3">
        {agentInsights.map((insight) => (
          <article
            key={insight.id}
            className={cn(
              "cursor-pointer rounded-lg border border-command-border border-l-[3px] p-3 transition-colors hover:border-command-teal/30",
              accentStyles[insight.accent],
            )}
          >
            <header className="mb-1.5 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  insight.accent === "orange"
                    ? "text-command-orange"
                    : "text-command-teal-bright",
                )}
              >
                {t(insight.type)}
              </span>
              <time className="text-[10px] text-command-text-muted">
                {t(insight.timeKey as "ago2m" | "ago1h")}
              </time>
            </header>
            <p className="text-sm leading-relaxed text-command-text-secondary">
              {t(insight.bodyKey as "riskAlertBody" | "marketIntelBody")}
            </p>
          </article>
        ))}
      </div>
    </CommandCard>
  );
}
