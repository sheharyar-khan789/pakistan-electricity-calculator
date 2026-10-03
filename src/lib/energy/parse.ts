/**
 * Strict parsing of numeric form fields for the energy tools.
 *
 * Accepts plain decimal numbers ("12", "12.5", ".5", "1,250"). Rejects empty
 * input, signs other than a leading minus (reported as "negative"), exponents,
 * words, "Infinity" and values outside the field's range. Every rule returns a
 * message written for the person filling in the form.
 */

export type NumberRule = {
  /** Field name used in messages, e.g. "Hours per day". */
  label: string;
  /** Lowest allowed value. */
  min: number;
  /** Highest allowed value. */
  max: number;
  /** When true, `min` itself is not allowed (value must be greater than it). */
  minExclusive?: boolean;
  /** Whole numbers only. */
  integer?: boolean;
  /** Unit appended to messages, e.g. "watts". */
  unit?: string;
  /** Overrides the range message, e.g. "Hours per day must be between 0 and 24." */
  rangeMessage?: string;
};

export type ParseResult = { ok: true; value: number } | { ok: false; message: string };

const DECIMAL = /^(\d+(\.\d*)?|\.\d+)$/;

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });

function rangeMessage(rule: NumberRule): string {
  if (rule.rangeMessage) return rule.rangeMessage;
  const unit = rule.unit ? ` ${rule.unit}` : "";
  if (rule.minExclusive) {
    return `${rule.label} must be greater than ${fmt(rule.min)}${unit} and no more than ${fmt(rule.max)}${unit}.`;
  }
  return `${rule.label} must be between ${fmt(rule.min)} and ${fmt(rule.max)}${unit}.`;
}

export function parseNumber(raw: string, rule: NumberRule): ParseResult {
  const text = raw.trim().replace(/,/g, "");
  if (text === "") return { ok: false, message: `Enter ${rule.label.toLowerCase()}.` };
  if (/^-\s*(\d|\.)/.test(text)) return { ok: false, message: `${rule.label} cannot be negative.` };
  if (!DECIMAL.test(text)) return { ok: false, message: `${rule.label} must be a number, for example 12 or 12.5.` };

  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, message: rangeMessage(rule) };
  if (rule.integer && !Number.isInteger(value)) {
    return { ok: false, message: `${rule.label} must be a whole number.` };
  }
  const belowMin = rule.minExclusive ? value <= rule.min : value < rule.min;
  if (belowMin || value > rule.max) return { ok: false, message: rangeMessage(rule) };
  return { ok: true, value };
}

/** Like `parseNumber`, but an empty field is valid and yields `null`. */
export function parseOptionalNumber(
  raw: string,
  rule: NumberRule,
): { ok: true; value: number | null } | { ok: false; message: string } {
  return raw.trim() === "" ? { ok: true, value: null } : parseNumber(raw, rule);
}

/* ------------------------------------------------------------------ */
/* Shared field rules (one place, so every tool says the same thing)   */
/* ------------------------------------------------------------------ */

export const RULES = {
  watts: {
    label: "Power",
    min: 0,
    minExclusive: true,
    max: 100_000,
    unit: "watts",
    rangeMessage: "Power must be greater than 0 watts and no more than 100,000 watts.",
  },
  kilowatts: {
    label: "Power",
    min: 0,
    minExclusive: true,
    max: 100,
    unit: "kW",
    rangeMessage: "Power must be greater than 0 kW and no more than 100 kW.",
  },
  quantity: {
    label: "Quantity",
    min: 1,
    max: 100,
    integer: true,
    rangeMessage: "Quantity must be a whole number from 1 to 100.",
  },
  hoursPerDay: {
    label: "Hours per day",
    min: 0,
    max: 24,
    rangeMessage: "Hours per day must be between 0 and 24.",
  },
  daysPerMonth: {
    label: "Days per month",
    min: 1,
    max: 31,
    integer: true,
    rangeMessage: "Days per month must be between 1 and 31.",
  },
  ratePerUnit: {
    label: "Rate per unit",
    min: 0,
    minExclusive: true,
    max: 1_000,
    rangeMessage: "Rate per unit must be greater than Rs. 0 and no more than Rs. 1,000.",
  },
  meterReading: {
    label: "Meter reading",
    min: 0,
    max: 99_999_999,
    rangeMessage: "Meter reading must be between 0 and 99,999,999.",
  },
  billingDays: {
    label: "Billing days",
    min: 1,
    max: 62,
    integer: true,
    rangeMessage: "Billing days must be a whole number from 1 to 62.",
  },
  runningShare: {
    label: "Time at rated power",
    min: 0,
    minExclusive: true,
    max: 100,
    rangeMessage: "Time at rated power must be greater than 0% and no more than 100%.",
  },
} as const satisfies Record<string, NumberRule>;

/** Rounds for display only; calculations keep full precision. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}
