"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CommandCard } from "@/components/ui/CommandCard";
import { useDashboard } from "@/components/providers/DashboardProvider";
import {
  salesRecords as fallbackSales,
  aggregateSales,
  AU_STATES,
  AU_REGION_LABELS,
} from "@/lib/finance/seed-data";

type GroupBy = "region" | "product" | "category" | "date";

export function FinanceDashboard() {
  const t = useTranslations("finance");
  const locale = useLocale();
  const { data } = useDashboard();
  const allRecords = data.finance.records.length ? data.finance.records : fallbackSales;
  const salesRecords = useMemo(
    () => allRecords.filter((r) => r.country === "AU"),
    [allRecords],
  );
  const financeProducts = [...new Set(salesRecords.map((r) => r.product))];
  const financeCategories = [...new Set(salesRecords.map((r) => r.category))];
  const financeMonths = [...new Set(salesRecords.map((r) => r.date))].sort();

  const [region, setRegion] = useState<string>("all");
  const [product, setProduct] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("product");

  const filtered = useMemo(() => {
    return salesRecords.filter((r) => {
      if (region !== "all" && r.region !== region) return false;
      if (product !== "all" && r.product !== product) return false;
      if (category !== "all" && r.category !== category) return false;
      if (month !== "all" && r.date !== month) return false;
      return true;
    });
  }, [salesRecords, region, product, category, month]);

  const aggregated = useMemo(() => aggregateSales(filtered, groupBy), [filtered, groupBy]);
  const maxRevenue = Math.max(...aggregated.map((a) => a.revenue), 1);
  const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0);
  const totalQuantity = filtered.reduce((s, r) => s + r.quantity, 0);

  const formatRegion = (code: string) => {
    const labels = AU_REGION_LABELS[code as keyof typeof AU_REGION_LABELS];
    if (!labels) return code;
    return locale.startsWith("zh") ? labels.zh : labels.en;
  };

  const formatGroupKey = (key: string) => {
    if (groupBy === "region") return formatRegion(key);
    return key;
  };

  return (
    <CommandCard title={t("title")}>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
            {t("country")}
          </label>
          <select disabled className="input-field text-xs opacity-70">
            <option value="AU">{t("australia")}</option>
          </select>
        </div>
        <FilterSelect
          label={t("region")}
          value={region}
          onChange={setRegion}
          options={[...AU_STATES]}
          allLabel={t("all")}
          formatOption={formatRegion}
        />
        <FilterSelect label={t("product")} value={product} onChange={setProduct} options={financeProducts} allLabel={t("all")} />
        <FilterSelect label={t("category")} value={category} onChange={setCategory} options={financeCategories} allLabel={t("all")} />
        <FilterSelect label={t("period")} value={month} onChange={setMonth} options={financeMonths} allLabel={t("all")} />
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
            {t("groupBy")}
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="input-field text-xs"
          >
            <option value="product">{t("product")}</option>
            <option value="category">{t("category")}</option>
            <option value="region">{t("region")}</option>
            <option value="date">{t("period")}</option>
          </select>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiBox label={t("totalRevenue")} value={formatCurrency(totalRevenue)} />
        <KpiBox label={t("totalQuantity")} value={`${totalQuantity.toLocaleString()} g`} />
        <KpiBox label={t("recordCount")} value={String(filtered.length)} />
        <KpiBox label={t("avgOrderValue")} value={filtered.length ? formatCurrency(Math.round(totalRevenue / filtered.length)) : "—"} />
      </div>

      <div className="mb-5 space-y-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-command-text-muted">
          {t("revenueBreakdown")}
        </h4>
        {aggregated.length === 0 ? (
          <p className="text-sm text-command-text-muted">{t("noData")}</p>
        ) : (
          aggregated.slice(0, 8).map((item) => {
            const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
            return (
              <div key={item.key} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-[11px] text-command-text-secondary sm:w-32">
                  {formatGroupKey(item.key)}
                </span>
                <div className="h-5 min-w-0 flex-1 overflow-hidden rounded bg-command-border">
                  <div
                    className="flex h-full items-center rounded bg-command-teal/70 pl-2 text-[9px] font-medium text-black transition-all"
                    style={{ width: `${Math.max((item.revenue / maxRevenue) * 100, 8)}%` }}
                  >
                    {item.revenue >= maxRevenue * 0.12 && formatCurrency(item.revenue)}
                  </div>
                </div>
                <span className="w-14 shrink-0 text-right text-[10px] tabular-nums text-command-teal-bright">
                  {pct.toFixed(1)}%
                </span>
                <span className="hidden w-20 shrink-0 text-right text-[10px] tabular-nums text-command-text-muted sm:block">
                  {item.quantity.toLocaleString()} g
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-0 text-left text-xs">
          <thead>
            <tr className="border-b border-command-border text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
              <th className="pb-2 pr-3">{t("period")}</th>
              <th className="pb-2 pr-3">{t("region")}</th>
              <th className="pb-2 pr-3">{t("product")}</th>
              <th className="pb-2 pr-3">{t("category")}</th>
              <th className="pb-2 pr-3 text-right">{t("quantity")}</th>
              <th className="pb-2 pr-3 text-right">{t("costUnitPrice")}</th>
              <th className="pb-2 pr-3 text-right">{t("totalCost")}</th>
              <th className="pb-2 pr-3 text-right">{t("salesUnitPrice")}</th>
              <th className="pb-2 text-right">{t("revenue")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-command-border/40 hover:bg-command-card-elevated/50">
                <td className="py-2 pr-3 text-command-text-muted">{r.date}</td>
                <td className="py-2 pr-3">{formatRegion(r.region)}</td>
                <td className="py-2 pr-3 font-medium text-command-teal-bright">{r.product}</td>
                <td className="py-2 pr-3 text-command-text-secondary">{r.category}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{r.quantity} {r.unit}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-command-text-muted">
                  {r.currency} {r.costUnitPrice.toLocaleString()}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-command-text-muted">
                  {r.currency} {r.totalCost.toLocaleString()}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {r.currency} {r.salesUnitPrice.toLocaleString()}
                </td>
                <td className="py-2 text-right tabular-nums font-medium">
                  {r.currency} {r.revenue.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CommandCard>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  formatOption,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
  formatOption?: (value: string) => string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-command-text-muted">
        {label}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field text-xs">
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>{formatOption ? formatOption(o) : o}</option>
        ))}
      </select>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-command-border bg-command-card-elevated p-3">
      <p className="text-[10px] text-command-text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-command-teal-bright">{value}</p>
    </div>
  );
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
