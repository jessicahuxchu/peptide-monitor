export interface SalesRecord {
  id: string;
  date: string;
  country: string;
  region: string;
  product: string;
  category: string;
  quantity: number;
  unit: string;
  revenue: number;
  currency: string;
}

export const AU_STATES = [
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "NT",
  "ACT",
] as const;

export const salesRecords: SalesRecord[] = [
  { id: "s1", date: "2026-01", country: "AU", region: "VIC", product: "BPC-157", category: "Healing", quantity: 1200, unit: "g", revenue: 1010880, currency: "AUD" },
  { id: "s2", date: "2026-01", country: "AU", region: "NSW", product: "BPC-157", category: "Healing", quantity: 800, unit: "g", revenue: 673600, currency: "AUD" },
  { id: "s3", date: "2026-01", country: "AU", region: "QLD", product: "TB-500", category: "Recovery", quantity: 400, unit: "g", revenue: 480000, currency: "AUD" },
  { id: "s4", date: "2026-02", country: "AU", region: "VIC", product: "BPC-157", category: "Healing", quantity: 1350, unit: "g", revenue: 1137150, currency: "AUD" },
  { id: "s5", date: "2026-02", country: "AU", region: "NSW", product: "BPC-157", category: "Healing", quantity: 650, unit: "g", revenue: 547300, currency: "AUD" },
  { id: "s6", date: "2026-02", country: "AU", region: "VIC", product: "GHK-Cu", category: "Cosmetic", quantity: 600, unit: "g", revenue: 390000, currency: "AUD" },
  { id: "s7", date: "2026-03", country: "AU", region: "VIC", product: "BPC-157", category: "Healing", quantity: 1500, unit: "g", revenue: 1263000, currency: "AUD" },
  { id: "s8", date: "2026-03", country: "AU", region: "QLD", product: "BPC-157", category: "Healing", quantity: 500, unit: "g", revenue: 421000, currency: "AUD" },
  { id: "s9", date: "2026-03", country: "AU", region: "NSW", product: "TB-500", category: "Recovery", quantity: 300, unit: "g", revenue: 360000, currency: "AUD" },
  { id: "s10", date: "2026-04", country: "AU", region: "VIC", product: "BPC-157", category: "Healing", quantity: 1600, unit: "g", revenue: 1347200, currency: "AUD" },
  { id: "s11", date: "2026-04", country: "AU", region: "NSW", product: "GHK-Cu", category: "Cosmetic", quantity: 450, unit: "g", revenue: 292500, currency: "AUD" },
  { id: "s12", date: "2026-05", country: "AU", region: "VIC", product: "BPC-157", category: "Healing", quantity: 1750, unit: "g", revenue: 1473500, currency: "AUD" },
  { id: "s13", date: "2026-05", country: "AU", region: "QLD", product: "BPC-157", category: "Healing", quantity: 700, unit: "g", revenue: 589400, currency: "AUD" },
  { id: "s14", date: "2026-05", country: "AU", region: "NSW", product: "Semaglutide", category: "Weight Loss", quantity: 200, unit: "g", revenue: 90000, currency: "AUD" },
  { id: "s15", date: "2026-06", country: "AU", region: "VIC", product: "BPC-157", category: "Healing", quantity: 1900, unit: "g", revenue: 1599800, currency: "AUD" },
  { id: "s16", date: "2026-06", country: "AU", region: "QLD", product: "TB-500", category: "Recovery", quantity: 550, unit: "g", revenue: 660000, currency: "AUD" },
  { id: "s17", date: "2026-06", country: "AU", region: "NSW", product: "BPC-157", category: "Healing", quantity: 400, unit: "g", revenue: 336800, currency: "AUD" },
  { id: "s18", date: "2026-06", country: "AU", region: "SA", product: "BPC-157", category: "Healing", quantity: 180, unit: "g", revenue: 151560, currency: "AUD" },
  { id: "s19", date: "2026-06", country: "AU", region: "WA", product: "GHK-Cu", category: "Cosmetic", quantity: 120, unit: "g", revenue: 78000, currency: "AUD" },
  { id: "s20", date: "2026-06", country: "AU", region: "TAS", product: "TB-500", category: "Recovery", quantity: 80, unit: "g", revenue: 96000, currency: "AUD" },
];

export const financeCountries = ["AU"] as const;
export const financeRegions = [...AU_STATES];
export const financeProducts = [...new Set(salesRecords.map((r) => r.product))];
export const financeCategories = [...new Set(salesRecords.map((r) => r.category))];
export const financeMonths = [...new Set(salesRecords.map((r) => r.date))].sort();

export function aggregateSales(
  records: SalesRecord[],
  groupBy: "country" | "region" | "product" | "category" | "date",
) {
  const map = new Map<string, { revenue: number; quantity: number; count: number }>();
  for (const r of records) {
    const key = r[groupBy];
    const prev = map.get(key) ?? { revenue: 0, quantity: 0, count: 0 };
    map.set(key, {
      revenue: prev.revenue + r.revenue,
      quantity: prev.quantity + r.quantity,
      count: prev.count + 1,
    });
  }
  return [...map.entries()]
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => b.revenue - a.revenue);
}
