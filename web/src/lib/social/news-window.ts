/** Inclusive UTC calendar-day window helpers for news digests. */

export function utcDayBounds(isoDate: string): {
  startMs: number;
  endMs: number;
} | null {
  const startMs = Date.parse(`${isoDate}T00:00:00.000Z`);
  const endMs = Date.parse(`${isoDate}T23:59:59.999Z`);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return { startMs, endMs };
}

/**
 * Window for “近 N 日” ending on `isoDate` (UTC).
 * Starts at 00:00 UTC of (isoDate − N days) through 23:59:59 UTC of isoDate,
 * so a rolling ~N×24h scrape ending that day does not drop the boundary morning.
 *
 * Example: N=7, date=2026-07-14 → 2026-07-07 00:00Z … 2026-07-14 23:59Z
 */
export function newsLookbackWindowEnding(
  isoDate: string,
  lookbackDays: number,
): { startMs: number; endMs: number; startIso: string; endIso: string } | null {
  const bounds = utcDayBounds(isoDate);
  if (!bounds || lookbackDays < 1) return null;
  const startMs = bounds.startMs - lookbackDays * 24 * 60 * 60 * 1000;
  return {
    startMs,
    endMs: bounds.endMs,
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(bounds.endMs).toISOString(),
  };
}
