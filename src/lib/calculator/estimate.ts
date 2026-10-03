import type { ProviderId } from "@/data/providers";
import type {
  AdjustmentDataset,
  CategoryTariff,
  PeriodicAdjustment,
  SourceDocument,
  TariffBand,
  TariffSchedule,
} from "@/lib/tariffs/types";
import { addMonths, formatBillingMonth } from "./billing-month";
import { kwTimesRate, paisaToRupees, scaledToPaisa, toScaled, unitsTimesRate } from "./money";
import { computeSlabCharges, findSlabIndex } from "./slabs";
import type {
  CalculationInput,
  CalculationOutcome,
  ChargeLine,
  PendingAdjustment,
  SlabChargeLine,
  SourceReference,
} from "./types";
import { MAX_UNITS_PER_BILL } from "./validation";

/** Sanctioned load is entered with at most 2 decimals (e.g. 2.75 kW). */
const MAX_LOAD_DECIMALS = 2;

export type EstimateContext = {
  providerId: ProviderId;
  schedule: TariffSchedule;
  category: CategoryTariff;
  band: TariffBand;
  adjustments: AdjustmentDataset;
  getSource: (id: string) => SourceDocument | undefined;
};

export const ESTIMATE_EXCLUSIONS: readonly string[] = [
  "Taxes and duties, such as General Sales Tax and electricity duty. These depend on your province, tax status and other factors, and are not included.",
  "Charges on your bill that are not part of NEPRA’s tariff schedule.",
  "Arrears, late payment surcharge, instalments and billing corrections.",
  "Prepaid, incremental consumption package and EV charging station tariffs. Time-of-use (5 kW and above) bills have their own calculator.",
];

const rs = (n: number, decimals = 2) =>
  `Rs. ${n.toLocaleString("en-PK", { minimumFractionDigits: decimals, maximumFractionDigits: 4 })}`;
const units = (n: number) => `${n.toLocaleString("en-PK")} ${n === 1 ? "unit" : "units"}`;
const kw = (n: number) => `${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })} kW`;
const slabLabel = (from: number, to: number | null) => (to === null ? `above ${from - 1}` : `${from}–${to}`);

function toReference(doc: SourceDocument): SourceReference {
  return {
    reference: doc.reference,
    title: doc.title,
    publisher: doc.publisher,
    url: doc.url,
    publishedOn: doc.publishedOn,
  };
}

function hasAtMostDecimals(value: number, decimals: number): boolean {
  const factor = 10 ** decimals;
  return Math.abs(Math.round(value * factor) - value * factor) < 1e-9;
}

function findAdjustment(
  data: AdjustmentDataset,
  kind: PeriodicAdjustment["kind"],
  ctx: EstimateContext,
  billingMonth: string,
): PeriodicAdjustment | undefined {
  return data.adjustments.find(
    (adj) =>
      adj.kind === kind &&
      adj.billingMonths.includes(billingMonth) &&
      adj.providers.includes(ctx.providerId) &&
      adj.categories.includes(ctx.category.categoryId),
  );
}

function pendingMessage(kind: PeriodicAdjustment["kind"], billingMonth: string, lagMonths: number): PendingAdjustment {
  if (kind === "fca") {
    const reference = formatBillingMonth(addMonths(billingMonth, -lagMonths));
    return {
      kind,
      label: `Fuel charges adjustment (${reference})`,
      message: `NEPRA had not notified the fuel charges adjustment for ${reference} when this data was last checked. It is normally charged in the ${formatBillingMonth(billingMonth)} bill and is not included.`,
    };
  }
  return {
    kind,
    label: "Quarterly tariff adjustment",
    message: `No quarterly tariff adjustment for ${formatBillingMonth(billingMonth)} bills had been notified when this data was last checked, so none is included.`,
  };
}

/**
 * Pure estimate for one provider, category, band and bill month.
 * Never invents figures: everything comes from `ctx`, which must already
 * have passed tariff-data validation.
 */
export function calculateEstimate(input: CalculationInput, ctx: EstimateContext): CalculationOutcome {
  const { band, category, schedule } = ctx;
  const month = input.billingMonth;
  const monthLabel = formatBillingMonth(month);

  /* ---------- validate ---------- */
  if (!Number.isInteger(input.unitsConsumed) || input.unitsConsumed < 0) {
    return { status: "invalid", errors: { unitsConsumed: "Units must be a whole number of 0 or more." } };
  }
  if (input.unitsConsumed > MAX_UNITS_PER_BILL) {
    return { status: "invalid", errors: { unitsConsumed: "Units look too high. Please check the value." } };
  }
  if (!ctx.adjustments.supportedBillingMonths.includes(month)) {
    return { status: "invalid", errors: { billingMonth: "Choose a bill month from the list." } };
  }
  if (band.maxUnits !== undefined && input.unitsConsumed > band.maxUnits) {
    return {
      status: "invalid",
      errors: {
        bandId: `${band.label} rates only apply up to ${band.maxUnits} units a month. For ${input.unitsConsumed} units, choose a different consumer status.`,
      },
    };
  }

  const load = input.sanctionedLoadKw;
  if (load === undefined) {
    return { status: "invalid", errors: { sanctionedLoadKw: "Enter your sanctioned load in kW." } };
  }
  if (!Number.isFinite(load) || load <= 0 || !hasAtMostDecimals(load, MAX_LOAD_DECIMALS)) {
    return {
      status: "invalid",
      errors: { sanctionedLoadKw: "Sanctioned load must be more than 0, with up to 2 decimal places." },
    };
  }
  if (load >= category.sanctionedLoadBelowKw) {
    return {
      status: "unavailable",
      reason: "load-not-supported",
      message: `Connections with a sanctioned load of ${category.sanctionedLoadBelowKw} kW or more are billed on time-of-use tariffs, which need peak and off-peak units. Use the time-of-use (TOU) bill calculator for them.`,
    };
  }
  if (band.maxSanctionedLoadKw !== undefined && load > band.maxSanctionedLoadKw) {
    return {
      status: "invalid",
      errors: {
        bandId: `${band.label} status only applies to connections with a sanctioned load up to ${band.maxSanctionedLoadKw} kW.`,
      },
    };
  }

  const qty = input.unitsConsumed;
  const lines: ChargeLine[] = [];
  const assumptions: string[] = [];
  const steps: string[] = [];

  /* ---------- energy (slab) charges ---------- */
  const slabCharges = computeSlabCharges(qty, band.slabs, band.pricing);
  const slabLines: SlabChargeLine[] = slabCharges.map((c) => ({
    fromUnits: c.slab.fromUnits,
    toUnits: c.slab.toUnits,
    ratePerUnit: c.slab.ratePerUnit,
    unitsCharged: c.unitsCharged,
    amount: paisaToRupees(scaledToPaisa(c.scaledAmount)),
  }));
  const energyScaled = slabCharges.reduce((sum, c) => sum + c.scaledAmount, 0);
  const energyPaisa = scaledToPaisa(energyScaled);
  lines.push({
    id: "energy",
    label: "Electricity charges",
    group: "energy",
    amount: paisaToRupees(energyPaisa),
    detail: slabCharges.map((c) => `${units(c.unitsCharged)} × ${rs(c.slab.ratePerUnit)}`).join(" + "),
  });
  const slabIndex = findSlabIndex(qty, band.slabs);
  const slab = band.slabs[slabIndex];
  steps.push(
    band.pricing === "one-previous-slab-benefit" && slabCharges.length > 1
      ? `${units(qty)} falls in the ${slabLabel(slab.fromUnits, slab.toUnits)} slab. As a protected consumer, the first ${units(slabCharges[0].unitsCharged)} are charged at the previous slab’s rate (${rs(slabCharges[0].slab.ratePerUnit)}) and the rest at ${rs(slab.ratePerUnit)}.`
      : `${units(qty)} falls in the ${slabLabel(slab.fromUnits, slab.toUnits)} slab, so every unit is charged at ${rs(slab.ratePerUnit)} per unit.`,
  );

  /* ---------- fixed / minimum charges ---------- */
  const fixed = band.fixedCharge;
  if (fixed.kind === "per-sanctioned-kw-by-slab") {
    const perKw = slab.fixedChargePerKwPerMonth;
    if (perKw === undefined) return { status: "error", message: "Tariff data is incomplete for this slab." };
    const fixedPaisa = scaledToPaisa(kwTimesRate(load, perKw));
    lines.push({
      id: "fixed",
      label: "Fixed charges",
      group: "fixed",
      amount: paisaToRupees(fixedPaisa),
      detail: `${kw(load)} sanctioned load × ${rs(perKw, 0)} per kW`,
    });
    steps.push(`Fixed charges are ${rs(perKw, 0)} per kW of sanctioned load for this slab: ${kw(load)} × ${rs(perKw, 0)}.`);
    assumptions.push(
      "Fixed charges use the per-kW rate of the slab your total consumption falls in, multiplied by your sanctioned load.",
    );
    if (qty === 0) assumptions.push("With 0 units, fixed charges use the first slab’s per-kW rate.");
  } else if (fixed.kind === "per-consumer") {
    lines.push({
      id: "fixed",
      label: "Fixed charges",
      group: "fixed",
      amount: paisaToRupees(scaledToPaisa(toScaled(fixed.amountPerMonth))),
      detail: `${rs(fixed.amountPerMonth, 0)} per consumer per month`,
    });
    steps.push(`A fixed charge of ${rs(fixed.amountPerMonth, 0)} per month applies.`);
  } else if (band.minimumCharge) {
    const minimum = band.phase === "single" ? band.minimumCharge.singlePhasePerMonth : band.minimumCharge.threePhasePerMonth;
    const minimumPaisa = scaledToPaisa(toScaled(minimum));
    if (energyPaisa < minimumPaisa) {
      lines.push({
        id: "minimum-charge",
        label: "Minimum monthly charge (top-up)",
        group: "fixed",
        amount: paisaToRupees(minimumPaisa - energyPaisa),
        detail: `Raises electricity charges to the ${rs(minimum, 0)} monthly minimum`,
      });
      steps.push(`Electricity charges are below the ${rs(minimum, 0)} minimum monthly charge, so the difference is added.`);
      assumptions.push(
        `The minimum monthly charge (${rs(minimum, 0)} for single-phase connections) is applied as a floor on electricity charges.`,
      );
    }
  }

  /* ---------- periodic adjustments ---------- */
  const pending: PendingAdjustment[] = [];
  const adjustmentSources: SourceReference[] = [];
  for (const kind of ctx.adjustments.expectedKinds) {
    const adj = findAdjustment(ctx.adjustments, kind, ctx, month);
    if (!adj) {
      pending.push(pendingMessage(kind, month, ctx.adjustments.fcaBillingLagMonths));
      continue;
    }
    if (adj.excludedBandIds.includes(band.id)) {
      steps.push(`${adj.label} does not apply to ${band.label.toLowerCase()} consumers.`);
      continue;
    }
    const amountPaisa = scaledToPaisa(unitsTimesRate(qty, adj.ratePerUnit));
    lines.push({
      id: adj.id,
      label: adj.label,
      group: "adjustment",
      amount: paisaToRupees(amountPaisa),
      detail: `${units(qty)} × ${rs(adj.ratePerUnit, 4)}`,
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
    steps.push(`Adjustments notified for ${monthLabel} bills are added per unit.`);
  }

  /* ---------- total ---------- */
  const totalPaisa = lines.reduce((sum, line) => sum + scaledToPaisa(toScaled(line.amount)), 0);
  const total = paisaToRupees(totalPaisa);
  steps.push("Taxes and duties are not included.");
  assumptions.push("Each charge is rounded to the nearest paisa and the total is their sum. Your bill may round differently.");

  return {
    status: "success",
    result: {
      input,
      bandLabel: band.label,
      total,
      breakdown: { lines, slabs: slabLines },
      effectiveCostPerUnit: qty > 0 ? Math.round((totalPaisa / qty)) / 100 : null,
      summarySteps: steps,
      assumptions,
      exclusions: ESTIMATE_EXCLUSIONS,
      pendingAdjustments: pending,
      taxesIncluded: false,
      tariff: {
        id: schedule.id,
        title: schedule.title,
        providerId: ctx.providerId,
        consumerCategoryId: category.categoryId,
        tariffReference: band.tariffReference,
        effectiveFrom: schedule.effectiveFrom,
        effectiveTo: schedule.effectiveTo ?? undefined,
        lastVerifiedOn: schedule.lastVerifiedOn,
        sources: [...schedule.sourceIds, ...(schedule.providerSourceIds?.[ctx.providerId] ?? [])]
          .map((id) => ctx.getSource(id))
          .filter((doc): doc is SourceDocument => doc !== undefined)
          .map(toReference),
      },
      adjustmentSources,
    },
  };
}

