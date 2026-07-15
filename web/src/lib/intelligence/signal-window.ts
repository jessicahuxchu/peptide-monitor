import { newsLookbackWindowEnding } from "@/lib/social/news-window";
import type { IntelSignal } from "./seed-data";

export type IntelDateMode = "last7" | "day";

/** Inclusive UTC dates from (endDate − days + 1) through endDate. */
export function utcDatesEnding(endDate: string, days: number): string[] {
  const endMs = Date.parse(`${endDate}T12:00:00.000Z`);
  if (Number.isNaN(endMs) || days < 1) return [];
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(
      new Date(endMs - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    );
  }
  return out;
}

export function signalInWindow(
  signal: Pick<IntelSignal, "date">,
  endDate: string,
  days: number,
): boolean {
  const window = newsLookbackWindowEnding(endDate, days);
  if (!window) return signal.date === endDate;
  const t = Date.parse(`${signal.date}T12:00:00.000Z`);
  if (Number.isNaN(t)) return false;
  const startDay = new Date(window.startMs).toISOString().slice(0, 10);
  const endDay = new Date(window.endMs).toISOString().slice(0, 10);
  return signal.date >= startDay && signal.date <= endDay;
}

export function filterSignalsByWindow(
  signals: IntelSignal[],
  mode: IntelDateMode,
  anchorDate: string,
  lookbackDays = 7,
): IntelSignal[] {
  if (mode === "day") {
    return signals.filter((s) => s.date === anchorDate);
  }
  return signals.filter((s) =>
    signalInWindow(s, anchorDate, lookbackDays),
  );
}
