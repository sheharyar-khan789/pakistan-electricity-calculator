/**
 * Calculation domain types.
 *
 * Flow: Provider → Consumer category → Input → Engine → Breakdown → Result
 *       (+ tariff version and source metadata attached to every result)
 *
 * These types contain NO tariff values. Figures live in `src/lib/tariffs/data`.
 */

import type { ProviderId } from "@/data/providers";

export type { ProviderId };

export type ConsumerCategoryId = "residential" | "commercial" | "industrial" | "agricultural";

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export type CalculationInput = {
  providerId: ProviderId;
  consumerCategoryId: ConsumerCategoryId;
  /** Units (kWh) consumed in the billing period. Whole number. */
  unitsConsumed: number;
  /** Bill month as printed on the bill, "YYYY-MM". Selects tariff version and adjustments. */
  billingMonth: string;
  /** Tariff band within the category, e.g. "protected". Defaults to the category default. */
  bandId?: string;
  /** Sanctioned load in kW, when the category needs it. */
  sanctionedLoadKw?: number;
};

/** What the form must collect for a provider + category, declared by the engine. */
export type CategoryRequirements = {
  categoryId: ConsumerCategoryId;
  /** Selectable consumer statuses; a single entry means no choice is shown. */
  bands: readonly {
    id: string;
    label: string;
    description: string;
    eligibility?: string;
  }[];
  defaultBandId: string;
  sanctionedLoad: { maxKwExclusive: number } | null;
  billingMonths: readonly { value: string; label: string }[];
};

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

export type SourceReference = {
  /** Official reference, e.g. "S.R.O. 279(I)/2026". */
  reference?: string;
  /** Document title as published. */
  title: string;
  publisher: string;
  url: string;
  /** ISO date the document was published / notified. */
  publishedOn?: string;
};

export type TariffVersion = {
  /** Stable identifier, e.g. "pk-uniform-gop-2026-02-12". */
  id: string;
  title: string;
  providerId: ProviderId;
  consumerCategoryId: ConsumerCategoryId;
  /** Tariff reference within the schedule, e.g. "A-1(a)". */
  tariffReference: string;
  /** ISO date the tariff takes effect. */
  effectiveFrom: string;
  /** ISO date the tariff stops applying, if known. */
  effectiveTo?: string;
  /** ISO date this record was last checked against its sources. */
  lastVerifiedOn: string;
  sources: readonly SourceReference[];
};

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

export type ChargeGroup = "energy" | "fixed" | "adjustment" | "tax" | "other";

export type ChargeLine = {
  id: string;
  label: string;
  group: ChargeGroup;
  /** Amount in PKR, rounded to the paisa. Negative values are credits. */
  amount: number;
  /** Calculation basis, e.g. "250 units × Rs. 33.10". */
  detail?: string;
};

export type SlabChargeLine = {
  fromUnits: number;
  toUnits: number | null;
  ratePerUnit: number;
  unitsCharged: number;
  /** PKR, rounded to the paisa. */
  amount: number;
};

export type CalculationBreakdown = {
  lines: readonly ChargeLine[];
  /** How units were spread across slabs for the energy charge. */
  slabs?: readonly SlabChargeLine[];
};

export type PendingAdjustment = {
  kind: "fca" | "qta";
  label: string;
  message: string;
};

export type CalculationResult = {
  input: CalculationInput;
  /** Label of the selected tariff band, e.g. "Protected". */
  bandLabel: string;
  /** Estimated total in PKR before taxes and duties, rounded to the paisa. */
  total: number;
  breakdown: CalculationBreakdown;
  /** total / unitsConsumed, or `null` when units is 0. */
  effectiveCostPerUnit: number | null;
  /** Plain-language steps explaining how the estimate was produced. */
  summarySteps: readonly string[];
  /** Assumptions the estimate relies on. */
  assumptions: readonly string[];
  /** Things the estimate does not include (taxes, arrears, …). */
  exclusions: readonly string[];
  /** Adjustments expected on this bill month but not yet notified. */
  pendingAdjustments: readonly PendingAdjustment[];
  /** False: taxes and duties are not part of the estimate. */
  taxesIncluded: false;
  tariff: TariffVersion;
  /** Sources for adjustments applied to this estimate. */
  adjustmentSources: readonly SourceReference[];
};

/* ------------------------------------------------------------------ */
/* Engine contract                                                     */
/* ------------------------------------------------------------------ */

export type FieldErrors = Partial<
  Record<
    | "providerId"
    | "consumerCategoryId"
    | "unitsConsumed"
    | "billingMonth"
    | "bandId"
    | "sanctionedLoadKw"
    | "form",
    string
  >
>;

export type UnavailableReason =
  | "engine-not-connected"
  | "category-not-supported"
  | "tariff-data-missing"
  | "load-not-supported";

export type CalculationOutcome =
  | { status: "success"; result: CalculationResult }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "unavailable"; reason: UnavailableReason; message: string }
  | { status: "error"; message: string };

export interface CalculationEngine {
  providerId: ProviderId;
  /** Categories this engine has verified tariff data for. */
  supportedCategories: readonly ConsumerCategoryId[];
  /** Inputs the form must collect for a category, or null if unsupported. */
  requirementsFor(categoryId: ConsumerCategoryId): CategoryRequirements | null;
  /** Tariff applied to a category in a bill month (for display before calculating). */
  tariffFor(categoryId: ConsumerCategoryId, billingMonth: string): TariffVersion | null;
  calculate(input: CalculationInput): CalculationOutcome;
}
