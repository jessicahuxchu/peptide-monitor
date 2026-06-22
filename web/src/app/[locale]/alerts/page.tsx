"use client";

import { useLocale, useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDbResource } from "@/hooks/useDbResource";
import { alerts as fallbackAlerts } from "@/lib/supply-chain/seed-data";
import { cn, formatDate } from "@/lib/utils";

const priorityStyle = {
  P0: "border-command-red/40 text-command-red",
  P1: "border-command-orange/40 text-command-orange",
  P2: "border-command-border text-command-text-secondary",
};

export default function AlertsPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const { data: alerts } = useDbResource("/api/alerts", fallbackAlerts);
  const sorted = [...alerts].sort((a, b) => {
    const p = { P0: 0, P1: 1, P2: 2 };
    return p[a.priority] - p[b.priority];
  });

  return (
    <div className="mx-auto max-w-[960px] p-4 md:p-6">
      <CommandCard title={t("pages.alerts.title")} subtitle={t("pages.alerts.description")}>
        <ul className="space-y-4">
          {sorted.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "rounded-xl border bg-command-card-elevated p-4",
                alert.status === "unread" && "border-command-teal/30",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[10px] font-bold",
                    priorityStyle[alert.priority],
                  )}
                >
                  {alert.priority}
                </span>
                <span className="text-[10px] uppercase text-command-text-muted">
                  {t(`alertSource.${alert.source}`)}
                </span>
                <span className="text-[10px] text-command-text-muted">
                  {formatDate(alert.createdAt, locale)}
                </span>
                {alert.status === "unread" && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-command-teal animate-pulse-dot" />
                )}
              </div>

              <h3 className="mt-2 font-semibold">{t(alert.titleKey)}</h3>
              <p className="mt-1 text-sm text-command-text-secondary">
                {t(alert.summaryKey)}
              </p>

              <div className="mt-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
                  {t("alertsPage.suggestedActions")}
                </p>
                <ul className="mt-1 space-y-1">
                  {alert.suggestedActions.map((action) => (
                    <li
                      key={action}
                      className="flex items-center gap-2 text-xs text-command-text-secondary"
                    >
                      <span className="h-1 w-1 rounded-full bg-command-teal" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </CommandCard>
    </div>
  );
}
