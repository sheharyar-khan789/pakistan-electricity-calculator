import { formatRupees, formatRupeesPrecise } from "@/lib/format";

/**
 * Display rounding for energy results. Precision shrinks as numbers grow, so
 * results never look more exact than the inputs behind them.
 */
export function formatKwhNumber(kwh: number): string {
  const decimals = kwh === 0 ? 0 : kwh < 10 ? 2 : kwh < 1000 ? 1 : 0;
  return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(kwh);
}

/** "12.5 kWh (units)" style label: 1 unit = 1 kWh. */
export function formatKwh(kwh: number): string {
  return `${formatKwhNumber(kwh)} kWh`;
}

/** Estimated cost: whole rupees, except small amounts which keep paisa. */
export function formatEstimatedCost(amount: number): string {
  return amount < 10 ? formatRupeesPrecise(amount) : formatRupees(amount);
}
