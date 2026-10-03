/**
 * Exact money arithmetic.
 *
 * Rounding policy (documented in docs/CALCULATION.md):
 * 1. Rates have at most 4 decimal places (e.g. Rs. 2.0581/kWh), so every
 *    intermediate product is held as an integer number of 1/10,000 rupee —
 *    no floating-point drift and no intermediate rounding.
 * 2. Each charge line is rounded ONCE, to the nearest paisa (1/100 rupee),
 *    with halves rounded away from zero.
 * 3. The total is the exact sum of the rounded lines.
 * 4. The UI displays the total rounded to the nearest rupee.
 */

/** Integer units per rupee for exact intermediate values. */
export const SCALE = 10_000;
const SCALE_PER_PAISA = SCALE / 100;

/** Rupee value (≤ 4 dp) → scaled integer. */
export function toScaled(rupees: number): number {
  return Math.round(rupees * SCALE);
}

/** Whole units × Rs/unit, exact. */
export function unitsTimesRate(units: number, ratePerUnit: number): number {
  return units * toScaled(ratePerUnit);
}

/** kW (≤ 2 dp) × Rs per kW, exact for rates with ≤ 2 dp. */
export function kwTimesRate(kw: number, ratePerKw: number): number {
  const kwHundredths = Math.round(kw * 100);
  return Math.round((kwHundredths * toScaled(ratePerKw)) / 100);
}

/** Scaled integer → whole paisa, halves away from zero. */
export function scaledToPaisa(scaled: number): number {
  const sign = scaled < 0 ? -1 : 1;
  const paisa = sign * Math.floor((Math.abs(scaled) + SCALE_PER_PAISA / 2) / SCALE_PER_PAISA);
  // Normalise −0 (e.g. a tiny credit that rounds to nothing) to 0.
  return paisa === 0 ? 0 : paisa;
}

export function paisaToRupees(paisa: number): number {
  return paisa / 100;
}

export function rupeesToPaisa(rupees: number): number {
  return scaledToPaisa(toScaled(rupees));
}
