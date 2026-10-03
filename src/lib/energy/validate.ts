import type { AcUse, ApplianceUse, ReadingsInput } from "./calculate";
import { RULES, parseNumber, parseOptionalNumber, type NumberRule } from "./parse";

/**
 * Form validation for the energy tools. Each validator takes the raw strings
 * from the form and returns either typed input for `calculate.ts` or one
 * message per invalid field. Pure, so every rule is unit-tested.
 */

export type FieldErrors<K extends string> = Partial<Record<K, string>>;
export type Validation<T, K extends string> = { ok: true; input: T } | { ok: false; errors: FieldErrors<K> };

/** Parses several fields at once, collecting every error. */
function parseAll<K extends string>(
  raw: Record<NoInfer<K>, string>,
  rules: Record<K, { rule: NumberRule; optional?: boolean }>,
): { values: Record<K, number | null>; errors: FieldErrors<K> } {
  const values = {} as Record<K, number | null>;
  const errors: FieldErrors<K> = {};
  for (const key of Object.keys(rules) as K[]) {
    const { rule, optional } = rules[key];
    const result = optional ? parseOptionalNumber(raw[key], rule) : parseNumber(raw[key], rule);
    if (result.ok) values[key] = result.value;
    else errors[key] = result.message;
  }
  return { values, errors };
}

const hasErrors = (errors: object) => Object.keys(errors).length > 0;

/* ------------------------------------------------------------------ */
/* Unit calculator                                                     */
/* ------------------------------------------------------------------ */

export type ReadingsField = "previousReading" | "currentReading" | "billingDays";
export type ReadingsFormValues = Record<ReadingsField, string>;

export const CURRENT_BELOW_PREVIOUS =
  "Current reading must be the same as or higher than the previous reading. If your meter was replaced, work out the units from each meter separately and add them.";

export function validateReadingsForm(raw: ReadingsFormValues): Validation<ReadingsInput, ReadingsField> {
  const { values, errors } = parseAll(raw, {
    previousReading: { rule: { ...RULES.meterReading, label: "Previous reading", rangeMessage: "Previous reading must be between 0 and 99,999,999." } },
    currentReading: { rule: { ...RULES.meterReading, label: "Current reading", rangeMessage: "Current reading must be between 0 and 99,999,999." } },
    billingDays: { rule: RULES.billingDays, optional: true },
  });
  if (!errors.previousReading && !errors.currentReading && values.currentReading! < values.previousReading!) {
    errors.currentReading = CURRENT_BELOW_PREVIOUS;
  }
  if (hasErrors(errors)) return { ok: false, errors };
  return {
    ok: true,
    input: {
      previousReading: values.previousReading!,
      currentReading: values.currentReading!,
      billingDays: values.billingDays,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Appliance calculator                                                */
/* ------------------------------------------------------------------ */

export type ApplianceField = "watts" | "quantity" | "hoursPerDay" | "daysPerMonth";
export type ApplianceFormValues = Record<ApplianceField, string>;

export function validateApplianceRow(raw: ApplianceFormValues): Validation<ApplianceUse, ApplianceField> {
  const { values, errors } = parseAll(raw, {
    watts: { rule: RULES.watts },
    quantity: { rule: RULES.quantity },
    hoursPerDay: { rule: RULES.hoursPerDay },
    daysPerMonth: { rule: RULES.daysPerMonth },
  });
  if (hasErrors(errors)) return { ok: false, errors };
  return {
    ok: true,
    input: {
      watts: values.watts!,
      quantity: values.quantity!,
      hoursPerDay: values.hoursPerDay!,
      daysPerMonth: values.daysPerMonth!,
    },
  };
}

/** An empty rate is allowed: the tools then show units only. */
export function validateRate(raw: string): { ok: true; value: number | null } | { ok: false; message: string } {
  return parseOptionalNumber(raw, RULES.ratePerUnit);
}

/* ------------------------------------------------------------------ */
/* AC calculator                                                       */
/* ------------------------------------------------------------------ */

export type PowerUnit = "W" | "kW";
export type AcField = "power" | "quantity" | "hoursPerDay" | "daysPerMonth" | "runningShare";
export type AcFormValues = Record<AcField, string> & { powerUnit: PowerUnit };

export function validateAcForm(raw: AcFormValues): Validation<AcUse, AcField> {
  const { values, errors } = parseAll(raw, {
    power: { rule: raw.powerUnit === "kW" ? RULES.kilowatts : RULES.watts },
    quantity: { rule: RULES.quantity },
    hoursPerDay: { rule: RULES.hoursPerDay },
    daysPerMonth: { rule: RULES.daysPerMonth },
    runningShare: { rule: RULES.runningShare },
  });
  if (hasErrors(errors)) return { ok: false, errors };
  return {
    ok: true,
    input: {
      watts: raw.powerUnit === "kW" ? values.power! * 1000 : values.power!,
      quantity: values.quantity!,
      hoursPerDay: values.hoursPerDay!,
      daysPerMonth: values.daysPerMonth!,
      runningSharePercent: values.runningShare!,
    },
  };
}
