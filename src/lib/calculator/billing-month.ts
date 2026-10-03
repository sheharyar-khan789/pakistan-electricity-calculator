/** Helpers for "YYYY-MM" bill months. */

const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

function parse(month: string): { year: number; month: number } {
  const [year, m] = month.split("-").map(Number);
  return { year, month: m };
}

/** "2026-10" → "October 2026". */
export function formatBillingMonth(month: string): string {
  const { year, month: m } = parse(month);
  return MONTH_FORMAT.format(new Date(Date.UTC(year, m - 1, 1)));
}

/** Adds (or subtracts) whole months: ("2026-01", -2) → "2025-11". */
export function addMonths(month: string, delta: number): string {
  const { year, month: m } = parse(month);
  const index = year * 12 + (m - 1) + delta;
  const y = Math.floor(index / 12);
  const mm = (index % 12) + 1;
  return `${y}-${String(mm).padStart(2, "0")}`;
}

/** Current bill month in Pakistan time. */
export function billingMonthOf(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Karachi",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

/**
 * Picks the bill month to preselect: the latest supported month not after
 * `today`, else the earliest supported month.
 */
export function pickDefaultBillingMonth(supported: readonly string[], today: string): string | null {
  if (supported.length === 0) return null;
  const sorted = [...supported].sort();
  const notAfter = sorted.filter((m) => m <= today);
  return notAfter.at(-1) ?? sorted[0];
}
