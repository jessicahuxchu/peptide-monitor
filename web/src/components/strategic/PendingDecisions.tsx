"use client";

import { useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDashboard } from "@/components/providers/DashboardProvider";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function PendingDecisions() {
  const t = useTranslations("decisions");
  const { data } = useDashboard();
  const pending = data.alerts.filter((a) => a.status === "unread" && a.priority === "P0");

  return (
    <CommandCard title={t("title")}>
      {pending.length === 0 ? (
        <p className="text-sm text-command-text-secondary">{t("none")}</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((alert) => (
            <li key={alert.id}>
              <Link
                href="/alerts"
                className="block rounded-lg border border-command-orange/30 bg-command-orange/5 p-3 transition-colors hover:border-command-orange/50"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-command-orange/20 px-1.5 py-0.5 text-[9px] font-bold text-command-orange">
                    {alert.priority}
                  </span>
                  <span className="text-xs font-medium text-command-text">
                    {t(alert.titleKey)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-command-text-secondary">
                  {t(alert.summaryKey)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CommandCard>
  );
}

export function WeeklyRegulatorySummary() {
  const t = useTranslations("weeklyReg");
  const items = ["item1", "item2", "item3"] as const;

  return (
    <CommandCard title={t("title")}>
      <ul className="space-y-2">
        {items.map((key, i) => (
          <li
            key={key}
            className={cn(
              "flex gap-2 text-xs leading-relaxed",
              i === 0 ? "text-command-orange" : "text-command-text-secondary",
            )}
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
            {t(key)}
          </li>
        ))}
      </ul>
    </CommandCard>
  );
}
