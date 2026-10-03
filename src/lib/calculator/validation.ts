import { isConsumerCategoryId } from "@/data/consumer-categories";
import { isProviderId } from "@/data/providers";
import type { CalculationInput, CategoryRequirements, ConsumerCategoryId, ProviderId } from "./types";

/**
 * Upper bound for a single billing period's units. This is an input sanity
 * limit to catch typos (e.g. an extra zero), NOT a tariff value.
 */
export const MAX_UNITS_PER_BILL = 1_000_000;

/** Meter readings are whole numbers; this bounds absurd input lengths. */
export const MAX_METER_READING = 99_999_999;

/** Sanity bound for typed sanctioned load (kW); tariff limits are enforced by the engine. */
export const MAX_SANCTIONED_LOAD_KW = 10_000;

export type UnitsInputMode = "units" | "readings";

/** Raw, untrusted form values exactly as typed by the user. */
export type CalculatorFormValues = {
  providerId: string;
  consumerCategoryId: string;
  billingMonth: string;
  bandId: string;
  sanctionedLoad: string;
  inputMode: UnitsInputMode;
  units: string;
  previousReading: string;
  currentReading: string;
};

export type CalculatorFieldName =
  | "providerId"
  | "consumerCategoryId"
  | "billingMonth"
  | "bandId"
  | "sanctionedLoad"
  | "units"
  | "previousReading"
  | "currentReading";

export type CalculatorFormErrors = Partial<Record<CalculatorFieldName, string>>;

export type FormValidationResult =
  | { ok: true; input: CalculationInput }
  | { ok: false; errors: CalculatorFormErrors };

const WHOLE_NUMBER = /^\d+$/;
const DECIMAL_2DP = /^\d+(\.\d{1,2})?$/;

/** Accepts "1,250" or " 1250 " as typed on a phone; rejects decimals/negatives. */
function parseWholeNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "");
  if (!WHOLE_NUMBER.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) ? value : null;
}

/** "2", "2.5", "2.75" → number; anything else → null. */
export function parseSanctionedLoad(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(/kw$/i, "");
  if (!DECIMAL_2DP.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function validateUnits(raw: string): { value?: number; error?: string } {
  if (raw.trim() === "") return { error: "Enter the units consumed, for example 250." };
  const value = parseWholeNumber(raw);
  if (value === null) return { error: "Units must be a whole number without decimals or minus signs." };
  if (value > MAX_UNITS_PER_BILL) {
    return {
      error: `Units look too high. Enter a value up to ${MAX_UNITS_PER_BILL.toLocaleString("en-US")}.`,
    };
  }
  return { value };
}

function validateReading(raw: string, label: string): { value?: number; error?: string } {
  if (raw.trim() === "") return { error: `Enter the ${label} meter reading.` };
  const value = parseWholeNumber(raw);
  if (value === null) return { error: `The ${label} reading must be a whole number.` };
  if (value > MAX_METER_READING) return { error: `The ${label} reading is too long.` };
  return { value };
}

export function unitsFromReadings(previous: number, current: number): number {
  return current - previous;
}

/**
 * Validates raw form values. `requirements` (from the engine) decides which
 * extra fields are needed; pass `null` when the provider/category has no
 * engine — the calculation then reports "unavailable" instead.
 */
export function validateCalculatorForm(
  values: CalculatorFormValues,
  requirements: CategoryRequirements | null,
): FormValidationResult {
  const errors: CalculatorFormErrors = {};

  let providerId: ProviderId | undefined;
  if (!values.providerId) errors.providerId = "Select your electricity provider.";
  else if (isProviderId(values.providerId)) providerId = values.providerId;
  else errors.providerId = "Select a provider from the list.";

  let consumerCategoryId: ConsumerCategoryId | undefined;
  if (!values.consumerCategoryId) errors.consumerCategoryId = "Select your consumer type.";
  else if (isConsumerCategoryId(values.consumerCategoryId)) consumerCategoryId = values.consumerCategoryId;
  else errors.consumerCategoryId = "Select a consumer type from the list.";

  // Without an engine (requirements === null) the month is not validated; the
  // calculation then reports "unavailable" rather than producing figures.
  const billingMonth = values.billingMonth;
  let bandId: string | undefined;
  let sanctionedLoadKw: number | undefined;

  if (requirements) {
    if (!billingMonth) errors.billingMonth = "Select your bill month.";
    else if (!requirements.billingMonths.some((m) => m.value === billingMonth)) {
      errors.billingMonth = "Select a bill month from the list.";
    }

    if (requirements.bands.length > 1) {
      if (!values.bandId) errors.bandId = "Select your consumer status.";
      else if (!requirements.bands.some((b) => b.id === values.bandId)) {
        errors.bandId = "Select a consumer status from the list.";
      } else bandId = values.bandId;
    } else {
      bandId = requirements.defaultBandId;
    }

    if (requirements.sanctionedLoad) {
      if (values.sanctionedLoad.trim() === "") {
        errors.sanctionedLoad = "Enter your sanctioned load in kW, for example 2.";
      } else {
        const load = parseSanctionedLoad(values.sanctionedLoad);
        if (load === null) errors.sanctionedLoad = "Enter the load as a number, for example 2 or 2.5.";
        else if (load <= 0) errors.sanctionedLoad = "Sanctioned load must be more than 0 kW.";
        else if (load > MAX_SANCTIONED_LOAD_KW) errors.sanctionedLoad = "Sanctioned load looks too high.";
        else sanctionedLoadKw = load;
      }
    }
  }

  let units: number | undefined;
  if (values.inputMode === "units") {
    const result = validateUnits(values.units);
    if (result.error) errors.units = result.error;
    units = result.value;
  } else {
    const previous = validateReading(values.previousReading, "previous");
    const current = validateReading(values.currentReading, "current");
    if (previous.error) errors.previousReading = previous.error;
    if (current.error) errors.currentReading = current.error;
    if (previous.value !== undefined && current.value !== undefined) {
      const difference = unitsFromReadings(previous.value, current.value);
      if (difference < 0) {
        errors.currentReading =
          "The current reading should be equal to or higher than the previous reading.";
      } else if (difference > MAX_UNITS_PER_BILL) {
        errors.currentReading =
          "The difference between readings looks too high. Please check both values.";
      } else {
        units = difference;
      }
    }
  }

  if (Object.values(errors).some(Boolean) || !providerId || !consumerCategoryId || units === undefined) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: { providerId, consumerCategoryId, unitsConsumed: units, billingMonth, bandId, sanctionedLoadKw },
  };
}
