import { calculateBill } from "@/lib/calculator/calculate";
import type { CalculationInput, CalculationOutcome, CalculationResult } from "@/lib/calculator/types";

export function input(overrides: Partial<CalculationInput> = {}): CalculationInput {
  return {
    providerId: "lesco",
    consumerCategoryId: "residential",
    unitsConsumed: 100,
    billingMonth: "2026-10",
    bandId: "unprotected",
    sanctionedLoadKw: 2,
    ...overrides,
  };
}

export async function run(overrides: Partial<CalculationInput> = {}): Promise<CalculationOutcome> {
  return calculateBill(input(overrides));
}

export async function success(overrides: Partial<CalculationInput> = {}): Promise<CalculationResult> {
  const outcome = await run(overrides);
  if (outcome.status !== "success") {
    throw new Error(`Expected success, got ${outcome.status}: ${JSON.stringify(outcome)}`);
  }
  return outcome.result;
}

/** Amount of a line by id, or undefined. */
export function line(result: CalculationResult, id: string): number | undefined {
  return result.breakdown.lines.find((l) => l.id === id)?.amount;
}
