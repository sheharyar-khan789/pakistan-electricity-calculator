/**
 * Tariff data schema.
 *
 * Tariff figures live ONLY in `src/lib/tariffs/data/*` as structured data
 * shaped by these types. The calculation engine reads them; UI components
 * never contain tariff values. Every dataset is checked by `validate.ts`
 * before any engine is allowed to use it.
 */

import type { ProviderId } from "@/data/providers";
import type { ConsumerCategoryId } from "@/lib/calculator/types";

/** ISO calendar date, e.g. "2026-02-12". */
export type IsoDate = string;

/**
 * Bill month as printed on a consumer's bill, ISO "YYYY-MM".
 * Adjustments are notified per bill month (e.g. "reflect … in the billing
 * month of September 2026").
 */
export type BillingMonth = string;

/**
 * What a document is. Decides how it may be cited:
 * - "uniform-tariff": the schedule shared by every covered provider;
 * - "provider-notification": one company's own schedule-of-tariff notification;
 * - "regulatory-decision": another NEPRA decision (e.g. K-Electric's review);
 * - "fca" / "qta": a monthly or quarterly adjustment decision.
 */
export type SourceKind = "uniform-tariff" | "provider-notification" | "regulatory-decision" | "fca" | "qta";

export type SourceDocument = {
  /** Stable id used to reference this document from data. */
  id: string;
  kind: SourceKind;
  /**
   * Providers the document legally applies to, as stated in it: "all" for
   * every provider of the data that cites it, or a list of companies.
   * Validation rejects any citation for a provider outside this list.
   */
  appliesTo: "all" | readonly ProviderId[];
  /** Official reference, e.g. "S.R.O. 279(I)/2026". */
  reference: string;
  title: string;
  publisher: string;
  publishedOn: IsoDate;
  url: string;
  /** Where in the document the data was read, e.g. "PDF pages 15 and 20–21". */
  location?: string;
  /** Date the notification takes effect, where the document states it. */
  effectiveFrom?: IsoDate;
};

/* ------------------------------------------------------------------ */
/* Base tariff                                                         */
/* ------------------------------------------------------------------ */

export type Slab = {
  /** Inclusive lower bound (units). */
  fromUnits: number;
  /** Inclusive upper bound; `null` = no upper bound. */
  toUnits: number | null;
  /** Variable charge, Rs/kWh. */
  ratePerUnit: number;
  /** Fixed charge for consumption in this slab, Rs per kW of sanctioned load per month. */
  fixedChargePerKwPerMonth?: number;
};

/**
 * How slab rates apply to a month's consumption.
 * - "single-slab": every unit is charged at the rate of the slab the total
 *   consumption falls in (no slab benefit).
 * - "one-previous-slab-benefit": units up to the previous slab's upper bound
 *   are charged at the previous slab's rate; the remainder at the current
 *   slab's rate. Only ONE previous slab is used.
 */
export type SlabPricing = "single-slab" | "one-previous-slab-benefit";

export type FixedChargeRule =
  | { kind: "none" }
  | { kind: "per-consumer"; amountPerMonth: number }
  /** Rate taken from the slab total consumption falls in, × sanctioned load (kW). */
  | { kind: "per-sanctioned-kw-by-slab" };

export type MinimumChargeRule = {
  singlePhasePerMonth: number;
  threePhasePerMonth: number;
};

export type TariffBand = {
  /** e.g. "lifeline" | "protected" | "unprotected" | "commercial-under-5kw". */
  id: string;
  label: string;
  /** Short explanation shown to users. */
  description: string;
  /** Tariff reference as printed in the schedule, e.g. "A-1(a)". */
  tariffReference: string;
  slabs: readonly Slab[];
  pricing: SlabPricing;
  fixedCharge: FixedChargeRule;
  /** Minimum monthly customer charge where no fixed charges apply. */
  minimumCharge?: MinimumChargeRule;
  /** Inclusive maximum monthly units for this band (eligibility). */
  maxUnits?: number;
  /** Inclusive maximum sanctioned load (kW) for this band. */
  maxSanctionedLoadKw?: number;
  /** Phase restriction from the band definition. */
  phase?: "single";
  /** Official eligibility wording, where the source defines it. */
  eligibility?: { text: string; sourceId: string };
};

export type CategoryTariff = {
  categoryId: ConsumerCategoryId;
  /**
   * Sanctioned load must be BELOW this (kW). At or above it the consumer is on
   * a time-of-use tariff, which this schedule entry does not model.
   */
  sanctionedLoadBelowKw: number;
  bands: readonly TariffBand[];
  defaultBandId: string;
  /** Official conditions quoted from the schedule. */
  notes: readonly string[];
};

/**
 * Time-of-use tariff for connections of 5 kW and above with a TOU meter.
 * Peak and off-peak units are charged at separate rates; the fixed charge
 * is per kW of "billing demand": the higher of a share of sanctioned load
 * and the maximum demand (MDI) recorded in the month.
 */
export type TimeOfUseTariff = {
  /** e.g. "residential-tou". */
  id: string;
  categoryId: ConsumerCategoryId;
  label: string;
  /** Tariff reference as printed in the schedule, e.g. "A-1(b)". */
  tariffReference: string;
  /** Applies at or above this sanctioned load (kW). */
  minSanctionedLoadKw: number;
  peakRatePerUnit: number;
  offPeakRatePerUnit: number;
  fixedChargePerKwPerMonth: number;
  billingDemand: {
    /** Share of sanctioned load, 0–1, e.g. 0.5. */
    sanctionedLoadShare: number;
    /** The rule as stated in the source (lightly normalised where the scan is unclear). */
    text: string;
    sourceId: string;
  };
  eligibility: { text: string; sourceId: string };
};

/** Peak hours as notified in one company's terms and conditions. */
export type PeakHours = {
  providerId: ProviderId;
  sourceId: string;
  /** Months inclusive, e.g. "December to February", with the peak window. */
  periods: readonly { months: string; peak: string }[];
  note: string;
};

export type TariffSchedule = {
  /** Stable version id. Never reuse an id for different figures. */
  id: string;
  title: string;
  providers: readonly ProviderId[];
  /** Date the notification takes effect. */
  effectiveFrom: IsoDate;
  /** Date it stops applying, or `null` while in force. */
  effectiveTo: IsoDate | null;
  /** First bill month this schedule applies to. */
  firstBillingMonth: BillingMonth;
  /** Last bill month, or `null` while in force. */
  lastBillingMonth: BillingMonth | null;
  lastVerifiedOn: IsoDate;
  /** Documents that apply to every provider on this schedule. */
  sourceIds: readonly string[];
  /**
   * Documents that apply to one provider only (e.g. its own tariff
   * notification). Never attributed to the schedule's other providers.
   */
  providerSourceIds?: Partial<Record<ProviderId, readonly string[]>>;
  categories: readonly CategoryTariff[];
  /** Time-of-use tariffs (5 kW and above), where verified. */
  timeOfUse?: readonly TimeOfUseTariff[];
  /** Peak hours, only for companies whose notification was read. */
  peakHours?: readonly PeakHours[];
};

/* ------------------------------------------------------------------ */
/* Periodic adjustments (kept separate from the base tariff)           */
/* ------------------------------------------------------------------ */

export type AdjustmentKind = "fca" | "qta";

export type PeriodicAdjustment = {
  id: string;
  kind: AdjustmentKind;
  /** e.g. "Fuel charges adjustment (July 2026)". */
  label: string;
  /** Rs/kWh; negative values are credits. */
  ratePerUnit: number;
  /** Bill months in which the adjustment is charged. */
  billingMonths: readonly BillingMonth[];
  providers: readonly ProviderId[];
  /** Consumer categories it applies to. */
  categories: readonly ConsumerCategoryId[];
  /** Tariff bands explicitly excluded by the decision (e.g. lifeline). */
  excludedBandIds: readonly string[];
  /**
   * Which units the rate is charged on.
   * - "current-bill": units on the bill it appears in.
   * - "units-of-month": units billed in a specific earlier month (FCA).
   */
  basis: { kind: "current-bill" } | { kind: "units-of-month"; month: BillingMonth };
  decidedOn: IsoDate;
  lastVerifiedOn: IsoDate;
  sourceId: string;
  /** Applicability as stated in the decision. */
  applicability: string;
};

export type AdjustmentDataset = {
  /** Bill months the calculator offers; adjustments for these were checked. */
  supportedBillingMonths: readonly BillingMonth[];
  /** Kinds expected on every bill; missing ones are reported as pending. */
  expectedKinds: readonly AdjustmentKind[];
  /** FCA for month M is billed in month M + this many months (per decisions). */
  fcaBillingLagMonths: number;
  lastVerifiedOn: IsoDate;
  adjustments: readonly PeriodicAdjustment[];
};
