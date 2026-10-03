const PKR_FORMATTER = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const PKR_PRECISE_FORMATTER = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const UNITS_FORMATTER = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** "Rs. 12,345" (rounded to the rupee). Negative amounts render as "− Rs. 500". */
export function formatRupees(amount: number): string {
  const formatted = `Rs. ${PKR_FORMATTER.format(Math.abs(amount))}`;
  return amount < 0 ? `− ${formatted}` : formatted;
}

/** "Rs. 42.17" — for per-unit rates. */
export function formatRupeesPrecise(amount: number): string {
  return `Rs. ${PKR_PRECISE_FORMATTER.format(amount)}`;
}

export function formatUnits(units: number): string {
  return `${UNITS_FORMATTER.format(units)} ${units === 1 ? "unit" : "units"}`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

/** "1 October 2026" from an ISO date string. */
export function formatDate(isoDate: string): string {
  return DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00+05:00`));
}

/** "https://www.lesco.gov.pk/" → "www.lesco.gov.pk" for display. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
