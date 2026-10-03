/**
 * Pure energy calculations for the unit, appliance and AC tools.
 *
 * 1 unit on a Pakistani electricity bill = 1 kilowatt-hour (kWh).
 * All functions take validated numbers and return full-precision results;
 * rounding happens only for display.
 */

/** Days used to project a monthly figure from a daily average. Stated on every page that uses it. */
export const DAYS_IN_PROJECTED_MONTH = 30;

/* ------------------------------------------------------------------ */
/* Units from meter readings                                           */
/* ------------------------------------------------------------------ */

export type ReadingsInput = {
  previousReading: number;
  currentReading: number;
  /** Days between the two readings, if known. */
  billingDays: number | null;
};

export type ReadingsResult =
  | {
      ok: true;
      /** Units (kWh) used between the readings. */
      units: number;
      /** Units per day; null when the number of days is unknown. */
      averagePerDay: number | null;
      /** Average per day × DAYS_IN_PROJECTED_MONTH; null when days unknown. */
      projectedMonthlyUnits: number | null;
    }
  | { ok: false; reason: "current-below-previous" };

export function unitsFromReadings(input: ReadingsInput): ReadingsResult {
  const { previousReading, currentReading, billingDays } = input;
  if (currentReading < previousReading) return { ok: false, reason: "current-below-previous" };
  // Subtract in tenths to avoid binary noise such as 1234.6 − 1200.2 = 34.39999…
  const units = (Math.round(currentReading * 10) - Math.round(previousReading * 10)) / 10;
  const averagePerDay = billingDays ? units / billingDays : null;
  return {
    ok: true,
    units,
    averagePerDay,
    projectedMonthlyUnits: averagePerDay === null ? null : averagePerDay * DAYS_IN_PROJECTED_MONTH,
  };
}

/* ------------------------------------------------------------------ */
/* Appliance energy                                                    */
/* ------------------------------------------------------------------ */

export type ApplianceUse = {
  /** Power in watts (W). Fractions are allowed, e.g. 8.5 W. */
  watts: number;
  quantity: number;
  hoursPerDay: number;
  daysPerMonth: number;
};

export type ApplianceEnergy = {
  /** kWh per day = W × quantity × hours ÷ 1000. */
  dailyKwh: number;
  /** kWh per month = daily kWh × days per month. */
  monthlyKwh: number;
};

export function applianceEnergy(use: ApplianceUse): ApplianceEnergy {
  const dailyKwh = (use.watts * use.quantity * use.hoursPerDay) / 1000;
  return { dailyKwh, monthlyKwh: dailyKwh * use.daysPerMonth };
}

export type ApplianceTotal = ApplianceEnergy & { items: ApplianceEnergy[] };

/** Sum of several appliances. Each keeps its own days per month. */
export function totalApplianceEnergy(uses: readonly ApplianceUse[]): ApplianceTotal {
  const items = uses.map(applianceEnergy);
  return {
    items,
    dailyKwh: items.reduce((sum, i) => sum + i.dailyKwh, 0),
    monthlyKwh: items.reduce((sum, i) => sum + i.monthlyKwh, 0),
  };
}

/** Energy cost = kWh × rate per unit (Rs/kWh). Unrounded. */
export function energyCost(kwh: number, ratePerUnit: number): number {
  return kwh * ratePerUnit;
}

/* ------------------------------------------------------------------ */
/* Air conditioner                                                     */
/* ------------------------------------------------------------------ */

export type AcUse = {
  /** Electrical input power in watts (from the rating plate or a meter). */
  watts: number;
  quantity: number;
  hoursPerDay: number;
  daysPerMonth: number;
  /**
   * Share of switched-on time the AC draws that power, 0–100 %. 100 % means
   * rated power for every hour of use. There is no universal figure: it
   * depends on weather, thermostat setting, room and the unit itself.
   */
  runningSharePercent: number;
};

export function acEnergy(use: AcUse): ApplianceEnergy {
  return applianceEnergy({
    watts: use.watts * (use.runningSharePercent / 100),
    quantity: use.quantity,
    hoursPerDay: use.hoursPerDay,
    daysPerMonth: use.daysPerMonth,
  });
}
