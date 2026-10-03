import type { ProviderId } from "@/data/providers";
import { getSourceDocument, loadTariffData, tariffSchedules, adjustmentData } from "@/lib/tariffs";
import type {
  AdjustmentDataset,
  PeriodicAdjustment,
  SourceDocument,
  TariffSchedule,
  TimeOfUseTariff,
} from "@/lib/tariffs/types";
import { addMonths, formatBillingMonth } from "./billing-month";
import { paisaToRupees, scaledToPaisa, toScaled, unitsTimesRate } from "./money";
import { findSchedule } from "./schedule-engine";
import type { ChargeLine, PendingAdjustment, SourceReference } from "./types";
import { MAX_UNITS_PER_BILL } from "./validation";

/**
 * Time-of-use (TOU) bill estimate for connections of 5 kW and above.
 *
 * Same rules as the slab estimate: figures come only from validated tariff
 * data, money is exact to 1/10,000 rupee and each line is rounded once to the
 * paisa, and an adjustment that has not been notified is reported, not guessed.
 */

export type TouCategoryId = "residential" | "commercial";

export type TouInput = {
  providerId: ProviderId;
  categoryId: TouCategoryId;
  billingMonth: string;
  peakUnits: number;
  offPeakUnits: number;
  /** kW, up to 2 decimals. */
  sanctionedLoadKw: number;
  /** Maximum demand (MDI) recorded in the month, kW; null when not known. */
  mdiKw: number | null;
};

export type TouField = "providerId" | "categoryId" | "billingMonth" | "peakUnits" | "offPeakUnits" | "sanctionedLoadKw" | "mdiKw";

export type TouResult = {
  input: TouInput;
  tariffLabel: string;
  tariffReference: string;
  total: number;
  totalUnits: number;
  lines: readonly ChargeLine[];
  /** kW the fixed charge was applied to. */
  billingDemandKw: number;
  billingDemandBasis: "sanctioned-load" | "mdi";
  effectiveCostPerUnit: number | null;
  steps: readonly string[];
  assumptions: readonly string[];
  exclusions: readonly string[];
  pendingAdjustments: readonly PendingAdjustment[];
  tariff: {
    scheduleId: string;
    title: string;
    effectiveFrom: string;
    lastVerifiedOn: string;
    sources: readonly SourceReference[];
  };
  adjustmentSources: readonly SourceReference[];
};

export type TouOutcome =
  | { status: "success"; result: TouResult }
  | { status: "invalid"; errors: Partial<Record<TouField, string>> }
  | { status: "unavailable"; message: string };

export const TOU_EXCLUSIONS: readonly string[] = [
  "Taxes and duties, such as General Sales Tax and electricity duty.",
  "Charges on your bill that are not part of NEPRA’s tariff schedule.",
  "Arrears, late payment surcharge, instalments and billing corrections.",
  "Power factor penalties, which apply where the power factor is below the limit in the terms and conditions.",
];

const MAX_LOAD_KW = 5000;
const rs = (n: number, decimals = 2) =>
  `Rs. ${n.toLocaleString("en-PK", { minimumFractionDigits: decimals, maximumFractionDigits: 4 })}`;
const units = (n: number) => `${n.toLocaleString("en-PK")} ${n === 1 ? "unit" : "units"}`;
const kw = (n: number) => `${n.toLocaleString("en-PK", { maximumFractionDigits: 4 })} kW`;

function hasAtMostDecimals(value: number, decimals: number): boolean {
  const factor = 10 ** decimals;
  return Math.abs(Math.round(value * factor) - value * factor) < 1e-9;
}

function toReference(doc: SourceDocument): SourceReference {
  return { reference: doc.reference, title: doc.title, publisher: doc.publisher, url: doc.url, publishedOn: doc.publishedOn };
}

export type TouContext = {
  schedule: TariffSchedule;
  tou: TimeOfUseTariff;
  adjustments: AdjustmentDataset;
  getSource: (id: string) => SourceDocument | undefined;
};

function pending(kind: PeriodicAdjustment["kind"], month: string, lag: number): PendingAdjustment {
  if (kind === "fca") {
    const reference = formatBillingMonth(addMonths(month, -lag));
    return {
      kind,
      label: `Fuel charges adjustment (${reference})`,
      message: `Not yet notified: NEPRA had not notified the fuel charges adjustment for ${reference} when this data was last checked. It is normally charged in the ${formatBillingMonth(month)} bill and is not included.`,
    };
  }
  return {
    kind,
    label: "Quarterly tariff adjustment",
    message: `Not yet notified: no quarterly tariff adjustment for ${formatBillingMonth(month)} bills had been notified when this data was last checked, so none is included.`,
  };
}

/** Pure TOU estimate. `ctx` must come from validated tariff data. */
export function calculateTouEstimate(input: TouInput, ctx: TouContext): TouOutcome {
  const { tou, schedule } = ctx;
  const errors: Partial<Record<TouField, string>> = {};
  for (const [field, value, label] of [
    ["peakUnits", input.peakUnits, "Peak units"],
    ["offPeakUnits", input.offPeakUnits, "Off-peak units"],
  ] as const) {
    if (!Number.isInteger(value) || value < 0) errors[field] = `${label} must be a whole number of 0 or more.`;
    else if (value > MAX_UNITS_PER_BILL) errors[field] = `${label} look too high. Please check the value.`;
  }
  const load = input.sanctionedLoadKw;
  if (!Number.isFinite(load) || !hasAtMostDecimals(load, 2) || load <= 0) {
    errors.sanctionedLoadKw = "Sanctioned load must be more than 0, with up to 2 decimal places.";
  } else if (load < tou.minSanctionedLoadKw) {
    errors.sanctionedLoadKw = `Time-of-use tariffs apply to a sanctioned load of ${tou.minSanctionedLoadKw} kW or more. For a smaller load, use the electricity bill calculator.`;
  } else if (load > MAX_LOAD_KW) {
    errors.sanctionedLoadKw = `This calculator supports a sanctioned load up to ${MAX_LOAD_KW.toLocaleString("en-PK")} kW.`;
  }
  if (input.mdiKw !== null && (!Number.isFinite(input.mdiKw) || input.mdiKw < 0 || !hasAtMostDecimals(input.mdiKw, 2) || input.mdiKw > MAX_LOAD_KW)) {
    errors.mdiKw = "MDI must be 0 or more, with up to 2 decimal places.";
  }
  if (!ctx.adjustments.supportedBillingMonths.includes(input.billingMonth)) {
    errors.billingMonth = "Choose a bill month from the list.";
  }
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const month = input.billingMonth;
  const totalUnits = input.peakUnits + input.offPeakUnits;
  const lines: ChargeLine[] = [];
  const steps: string[] = [];
  const assumptions: string[] = [];

  /* ---------- energy ---------- */
  lines.push({
    id: "peak",
    label: "Peak electricity charges",
    group: "energy",
    amount: paisaToRupees(scaledToPaisa(unitsTimesRate(input.peakUnits, tou.peakRatePerUnit))),
    detail: `${units(input.peakUnits)} × ${rs(tou.peakRatePerUnit)}`,
  });
  lines.push({
    id: "off-peak",
    label: "Off-peak electricity charges",
    group: "energy",
    amount: paisaToRupees(scaledToPaisa(unitsTimesRate(input.offPeakUnits, tou.offPeakRatePerUnit))),
    detail: `${units(input.offPeakUnits)} × ${rs(tou.offPeakRatePerUnit)}`,
  });
  steps.push(
    `Peak units are charged at ${rs(tou.peakRatePerUnit)} and off-peak units at ${rs(tou.offPeakRatePerUnit)} per unit. There are no slabs on time-of-use tariffs.`,
  );

  /* ---------- fixed charges on billing demand ---------- */
  // Exact: kW in hundredths × share × rate in 1/10,000 rupee.
  const share = tou.billingDemand.sanctionedLoadShare;
  const shareOfLoad = (Math.round(load * 100) * share) / 100;
  const useMdi = input.mdiKw !== null && input.mdiKw > shareOfLoad;
  const billingDemandKw = useMdi ? input.mdiKw! : shareOfLoad;
  const fixedScaled = Math.round((Math.round(billingDemandKw * 10_000) * toScaled(tou.fixedChargePerKwPerMonth)) / 10_000);
  const sharePct = `${Math.round(share * 100)}%`;
  lines.push({
    id: "fixed",
    label: "Fixed charges",
    group: "fixed",
    amount: paisaToRupees(scaledToPaisa(fixedScaled)),
    detail: `${kw(billingDemandKw)} × ${rs(tou.fixedChargePerKwPerMonth, 0)} per kW`,
  });
  steps.push(
    useMdi
      ? `Fixed charges use your MDI of ${kw(billingDemandKw)}, because it is higher than ${sharePct} of your sanctioned load (${kw(shareOfLoad)}).`
      : `Fixed charges use ${sharePct} of your sanctioned load (${kw(shareOfLoad)})${input.mdiKw !== null ? ", because it is higher than your MDI" : ""}, at ${rs(tou.fixedChargePerKwPerMonth, 0)} per kW.`,
  );
  if (input.mdiKw === null) {
    assumptions.push(
      `No MDI was entered, so fixed charges use ${sharePct} of the sanctioned load. If the maximum demand recorded on your meter is higher, your fixed charges will be higher.`,
    );
  }

  /* ---------- adjustments ---------- */
  const pendingAdjustments: PendingAdjustment[] = [];
  const adjustmentSources: SourceReference[] = [];
  for (const kind of ctx.adjustments.expectedKinds) {
    const adj = ctx.adjustments.adjustments.find(
      (a) =>
        a.kind === kind &&
        a.billingMonths.includes(month) &&
        a.providers.includes(input.providerId) &&
        a.categories.includes(tou.categoryId),
    );
    if (!adj) {
      pendingAdjustments.push(pending(kind, month, ctx.adjustments.fcaBillingLagMonths));
      continue;
    }
    lines.push({
      id: adj.id,
      label: adj.label,
      group: "adjustment",
      amount: paisaToRupees(scaledToPaisa(unitsTimesRate(totalUnits, adj.ratePerUnit))),
      detail: `${units(totalUnits)} × ${rs(adj.ratePerUnit, 4)}`,
    });
    const doc = ctx.getSource(adj.sourceId);
    if (doc) adjustmentSources.push(toReference(doc));
    if (adj.basis.kind === "units-of-month") {
      assumptions.push(
        `NEPRA charges the ${adj.label.toLowerCase()} on the units billed in ${formatBillingMonth(adj.basis.month)}. This estimate applies it to the units you entered.`,
      );
    }
  }
  if (lines.some((l) => l.group === "adjustment")) {
    steps.push(`Adjustments notified for ${formatBillingMonth(month)} bills are added on peak and off-peak units alike.`);
  }

  const totalPaisa = lines.reduce((sum, l) => sum + Math.round(l.amount * 100), 0);
  assumptions.push("Each charge is rounded to the nearest paisa and the total is their sum. Your bill may round differently.");
  steps.push("Taxes and duties are not included.");

  const sourceIds = [...schedule.sourceIds, ...(schedule.providerSourceIds?.[input.providerId] ?? [])];
  return {
    status: "success",
    result: {
      input,
      tariffLabel: tou.label,
      tariffReference: tou.tariffReference,
      total: paisaToRupees(totalPaisa),
      totalUnits,
      lines,
      billingDemandKw,
      billingDemandBasis: useMdi ? "mdi" : "sanctioned-load",
      effectiveCostPerUnit: totalUnits > 0 ? Math.round(totalPaisa / totalUnits) / 100 : null,
      steps,
      assumptions,
      exclusions: TOU_EXCLUSIONS,
      pendingAdjustments,
      tariff: {
        scheduleId: schedule.id,
        title: schedule.title,
        effectiveFrom: schedule.effectiveFrom,
        lastVerifiedOn: schedule.lastVerifiedOn,
        sources: sourceIds
          .map(ctx.getSource)
          .filter((d): d is SourceDocument => d !== undefined)
          .map(toReference),
      },
      adjustmentSources,
    },
  };
}

const dataIsValid = loadTariffData().ok;

/** The verified TOU tariff for a provider, category and bill month, or null. */
export function getTouTariff(providerId: ProviderId, categoryId: TouCategoryId, billingMonth: string) {
  if (!dataIsValid) return null;
  const schedule = findSchedule(tariffSchedules, providerId, billingMonth);
  const tou = schedule?.timeOfUse?.find((t) => t.categoryId === categoryId);
  return schedule && tou ? { schedule, tou } : null;
}

/** Estimate from the live, validated data. */
export function estimateTou(input: TouInput): TouOutcome {
  if (!adjustmentData.supportedBillingMonths.includes(input.billingMonth)) {
    return { status: "invalid", errors: { billingMonth: "Choose a bill month from the list." } };
  }
  const found = getTouTariff(input.providerId, input.categoryId, input.billingMonth);
  if (!found) {
    return {
      status: "unavailable",
      message: "A verified time-of-use tariff is not available for this provider and connection type yet.",
    };
  }
  return calculateTouEstimate(input, { ...found, adjustments: adjustmentData, getSource: getSourceDocument });
}

/** Providers with a verified TOU tariff for at least one supported bill month. */
export function touProviders(): ProviderId[] {
  if (!dataIsValid) return [];
  const ids = new Set<ProviderId>();
  for (const s of tariffSchedules) if (s.timeOfUse?.length) s.providers.forEach((p) => ids.add(p));
  return [...ids];
}
