import type { Slab, SlabPricing } from "@/lib/tariffs/types";
import { unitsTimesRate } from "./money";

export type SlabCharge = {
  slab: Slab;
  unitsCharged: number;
  /** Exact amount as a scaled integer (see money.ts). */
  scaledAmount: number;
};

/** Index of the slab containing `units` (inclusive bounds), or -1. */
export function findSlabIndex(units: number, slabs: readonly Slab[]): number {
  return slabs.findIndex(
    (slab) => units >= slab.fromUnits && (slab.toUnits === null || units <= slab.toUnits),
  );
}

/**
 * Splits a month's consumption across slabs according to the pricing rule.
 * Throws on units outside the slab table — callers validate first, and a
 * throw here means malformed data, which must not produce a number.
 */
export function computeSlabCharges(
  units: number,
  slabs: readonly Slab[],
  pricing: SlabPricing,
): SlabCharge[] {
  if (!Number.isInteger(units) || units < 0) throw new RangeError(`Invalid units: ${units}`);
  const index = findSlabIndex(units, slabs);
  if (index === -1) throw new RangeError(`No slab covers ${units} units`);
  const current = slabs[index];

  if (pricing === "single-slab" || index === 0) {
    return [{ slab: current, unitsCharged: units, scaledAmount: unitsTimesRate(units, current.ratePerUnit) }];
  }

  // one-previous-slab-benefit: units up to the previous slab's upper bound at
  // the previous slab's rate; only the remainder at the current slab's rate.
  const previous = slabs[index - 1];
  if (previous.toUnits === null) throw new RangeError("Previous slab cannot be open-ended");
  const previousUnits = previous.toUnits;
  const remainder = units - previousUnits;
  return [
    {
      slab: previous,
      unitsCharged: previousUnits,
      scaledAmount: unitsTimesRate(previousUnits, previous.ratePerUnit),
    },
    { slab: current, unitsCharged: remainder, scaledAmount: unitsTimesRate(remainder, current.ratePerUnit) },
  ];
}
