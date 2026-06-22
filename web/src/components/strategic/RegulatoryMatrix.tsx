"use client";

import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDashboard } from "@/components/providers/DashboardProvider";
import { regulatoryBodies as fallbackBodies } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function RegulatoryMatrix() {
  const t = useTranslations("regulatory");
  const { data } = useDashboard();
  const regulatoryBodies =
    (data.config.regulatory_bodies as typeof fallbackBodies | null) ??
    fallbackBodies;

  return (
    <CommandCard title={t("title")} subtitle={t("subtitle")}>
      <div className="grid grid-cols-2 gap-2">
        {regulatoryBodies.map((body) => {
          const isAttention = body.status === "attention";

          return (
            <div
              key={body.code}
              className={cn(
                "rounded-lg border px-3 py-3 transition-colors",
                isAttention
                  ? "border-command-orange/40 bg-command-orange/5"
                  : "border-command-border bg-command-card-elevated",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isAttention ? "bg-command-orange" : "bg-command-teal",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-semibold tracking-wide",
                    isAttention
                      ? "text-command-orange"
                      : "text-command-teal-bright",
                  )}
                >
                  {t(body.code as "tga" | "fda" | "nmpa" | "ema")}
                </span>
              </div>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                {t(body.regionKey)}
              </p>
            </div>
          );
        })}
      </div>
    </CommandCard>
  );
}
