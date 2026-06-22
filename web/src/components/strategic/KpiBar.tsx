"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDashboard } from "@/components/providers/DashboardProvider";
import { calcOverallKpisFromState } from "@/lib/supply-chain/utils";

export function KpiBar() {
  const t = useTranslations("kpi");
  const { data } = useDashboard();
  const openAlerts = data.alerts.filter((a) => a.status !== "done").length;
  const kpis = calcOverallKpisFromState(data.supplyChain, openAlerts);

  const items = [
    {
      label: t("feasiblePaths"),
      value: `${kpis.feasiblePaths}/${kpis.totalActivePaths}`,
      href: "/supply-chain",
    },
    {
      label: t("docCompletion"),
      value: `${kpis.docCompletion}%`,
      href: "/supply-chain",
    },
    {
      label: t("openAlerts"),
      value: String(kpis.openAlerts),
      href: "/alerts",
      highlight: kpis.openAlerts > 0,
    },
    {
      label: t("topSku"),
      value: kpis.topSku,
      href: "/intelligence",
    },
  ];

  return (
    <div className="border-b border-command-border bg-command-card/50 px-4 py-3 md:px-6">
      <div className="mx-auto flex w-full max-w-full flex-wrap gap-3 md:gap-6">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex items-baseline gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-command-card-elevated"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
              {item.label}
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                item.highlight
                  ? "text-command-orange"
                  : "text-command-teal-bright group-hover:text-command-teal"
              }`}
            >
              {item.value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
