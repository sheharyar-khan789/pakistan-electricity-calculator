import { isProviderId } from "@/data/providers";
import { isConsumerCategoryId } from "@/data/consumer-categories";
import type {
  AdjustmentDataset,
  BillingMonth,
  IsoDate,
  Slab,
  SourceDocument,
  TariffBand,
  TariffSchedule,
} from "./types";

/**
 * Structural and consistency checks for tariff data. Engines are only built
 * from data that passes; anything malformed fails safe (no estimates).
 */

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const BILLING_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Upper sanity bound for any per-unit rate (Rs/kWh). Catches typos like 2244 for 22.44. */
const MAX_PLAUSIBLE_RATE = 500;
/** Upper sanity bound for any fixed/minimum charge figure (Rs). */
const MAX_PLAUSIBLE_FIXED_CHARGE = 100_000;

export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isBillingMonth(value: string): value is BillingMonth {
  return BILLING_MONTH.test(value);
}

/** Positive, plausible and with at most 4 decimals (money is exact to 1/10,000 rupee). */
function isRate(n: number): boolean {
  return n > 0 && n <= MAX_PLAUSIBLE_RATE && Math.abs(Math.round(n * 10_000) - n * 10_000) < 1e-6;
}

function isFiniteNonNegative(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

export function validateSlabs(slabs: readonly Slab[], path: string): string[] {
  const errors: string[] = [];
  if (slabs.length === 0) return [`${path}: has no slabs`];

  if (slabs[0].fromUnits !== 0) errors.push(`${path}: first slab must start at 0 units`);

  slabs.forEach((slab, i) => {
    const at = `${path}.slabs[${i}]`;
    if (!Number.isInteger(slab.fromUnits) || slab.fromUnits < 0) errors.push(`${at}: invalid fromUnits`);
    if (slab.toUnits !== null && (!Number.isInteger(slab.toUnits) || slab.toUnits < slab.fromUnits)) {
      errors.push(`${at}: toUnits must be an integer ≥ fromUnits`);
    }
    if (!isFiniteNonNegative(slab.ratePerUnit) || slab.ratePerUnit > MAX_PLAUSIBLE_RATE) {
      errors.push(`${at}: implausible ratePerUnit ${slab.ratePerUnit}`);
    }
    if (
      slab.fixedChargePerKwPerMonth !== undefined &&
      (!isFiniteNonNegative(slab.fixedChargePerKwPerMonth) ||
        slab.fixedChargePerKwPerMonth > MAX_PLAUSIBLE_FIXED_CHARGE)
    ) {
      errors.push(`${at}: implausible fixedChargePerKwPerMonth`);
    }
    const next = slabs[i + 1];
    if (next) {
      if (slab.toUnits === null) errors.push(`${at}: only the last slab may be open-ended`);
      else if (next.fromUnits !== slab.toUnits + 1) {
        errors.push(`${at}: gap or overlap before next slab (${slab.toUnits} → ${next.fromUnits})`);
      }
    }
  });
  return errors;
}

function validateBand(band: TariffBand, path: string): string[] {
  const errors = validateSlabs(band.slabs, path);
  const last = band.slabs.at(-1);

  if (band.maxUnits !== undefined) {
    if (!Number.isInteger(band.maxUnits) || band.maxUnits < 0) errors.push(`${path}: invalid maxUnits`);
    // Slabs must cover every unit the band allows.
    if (last && last.toUnits !== null && last.toUnits < band.maxUnits) {
      errors.push(`${path}: slabs do not cover maxUnits ${band.maxUnits}`);
    }
  } else if (last && last.toUnits !== null) {
    errors.push(`${path}: last slab must be open-ended when the band has no maxUnits`);
  }

  if (band.fixedCharge.kind === "per-sanctioned-kw-by-slab") {
    band.slabs.forEach((slab, i) => {
      if (slab.fixedChargePerKwPerMonth === undefined) {
        errors.push(`${path}.slabs[${i}]: missing fixedChargePerKwPerMonth for per-kW fixed charges`);
      }
    });
  }
  if (band.fixedCharge.kind === "per-consumer" && !isFiniteNonNegative(band.fixedCharge.amountPerMonth)) {
    errors.push(`${path}: invalid per-consumer fixed charge`);
  }
  if (band.minimumCharge && band.fixedCharge.kind !== "none") {
    errors.push(`${path}: minimum charge only applies where no fixed charges apply`);
  }
  if (
    band.minimumCharge &&
    (!isFiniteNonNegative(band.minimumCharge.singlePhasePerMonth) ||
      !isFiniteNonNegative(band.minimumCharge.threePhasePerMonth))
  ) {
    errors.push(`${path}: invalid minimum charge`);
  }
  if (band.pricing === "one-previous-slab-benefit" && band.slabs.length < 2) {
    errors.push(`${path}: previous-slab benefit needs at least two slabs`);
  }
  return errors;
}

const SOURCE_KINDS = new Set(["uniform-tariff", "provider-notification", "regulatory-decision", "fca", "qta"]);
/** Official notification number, e.g. "S.R.O. 279(I)/2026". */
const SRO_REFERENCE = /^S\.R\.O\. \d+\(I\)\/\d{4}$/;

export function validateSources(sources: readonly SourceDocument[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const references = new Map<string, string>();
  for (const doc of sources) {
    const at = `source "${doc.id}"`;
    if (ids.has(doc.id)) errors.push(`${at}: duplicate id`);
    ids.add(doc.id);
    if (!SRO_REFERENCE.test(doc.reference)) errors.push(`${at}: notification number missing or not in "S.R.O. n(I)/yyyy" form`);
    const other = references.get(doc.reference);
    if (other) errors.push(`${at}: same notification as "${other}" (duplicate source)`);
    else references.set(doc.reference, doc.id);
    if (!SOURCE_KINDS.has(doc.kind)) errors.push(`${at}: invalid kind`);
    if (doc.appliesTo !== "all") {
      if (doc.appliesTo.length === 0) errors.push(`${at}: appliesTo is empty`);
      for (const p of doc.appliesTo) if (!isProviderId(p)) errors.push(`${at}: unknown provider ${p}`);
    }
    if (doc.kind === "provider-notification" && (doc.appliesTo === "all" || doc.appliesTo.length !== 1)) {
      errors.push(`${at}: a provider notification must apply to exactly one provider`);
    }
    if ((doc.kind === "uniform-tariff" || doc.kind === "provider-notification") && !doc.effectiveFrom) {
      errors.push(`${at}: tariff notification without effectiveFrom`);
    }
    if (doc.effectiveFrom !== undefined && !isIsoDate(doc.effectiveFrom)) errors.push(`${at}: invalid effectiveFrom`);
    if (!doc.reference.trim() || !doc.title.trim() || !doc.publisher.trim()) errors.push(`${at}: missing text fields`);
    if (!isIsoDate(doc.publishedOn)) errors.push(`${at}: invalid publishedOn`);
    if (!/^https:\/\/(www\.)?nepra\.org\.pk\//.test(doc.url)) {
      errors.push(`${at}: URL must be an official nepra.org.pk https link`);
    }
  }
  return errors;
}

export function validateSchedule(
  schedule: TariffSchedule,
  knownSourceIds: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  const at = `schedule "${schedule.id}"`;

  if (!schedule.id.trim()) errors.push(`${at}: missing id`);
  if (schedule.providers.length === 0) errors.push(`${at}: no providers`);
  for (const p of schedule.providers) if (!isProviderId(p)) errors.push(`${at}: unknown provider ${p}`);
  if (!isIsoDate(schedule.effectiveFrom)) errors.push(`${at}: invalid effectiveFrom`);
  if (schedule.effectiveTo !== null) {
    if (!isIsoDate(schedule.effectiveTo)) errors.push(`${at}: invalid effectiveTo`);
    else if (schedule.effectiveTo < schedule.effectiveFrom) errors.push(`${at}: effectiveTo before effectiveFrom`);
  }
  if (!isBillingMonth(schedule.firstBillingMonth)) errors.push(`${at}: invalid firstBillingMonth`);
  if (schedule.lastBillingMonth !== null) {
    if (!isBillingMonth(schedule.lastBillingMonth)) errors.push(`${at}: invalid lastBillingMonth`);
    else if (schedule.lastBillingMonth < schedule.firstBillingMonth) {
      errors.push(`${at}: lastBillingMonth before firstBillingMonth`);
    }
  }
  if (!isIsoDate(schedule.lastVerifiedOn)) errors.push(`${at}: invalid lastVerifiedOn`);
  if (schedule.sourceIds.length === 0) errors.push(`${at}: no sources`);
  for (const id of schedule.sourceIds) if (!knownSourceIds.has(id)) errors.push(`${at}: unknown source ${id}`);
  for (const [providerId, ids] of Object.entries(schedule.providerSourceIds ?? {})) {
    if (!isProviderId(providerId) || !schedule.providers.includes(providerId)) {
      errors.push(`${at}: provider source for ${providerId}, which is not on this schedule`);
    }
    for (const id of ids ?? []) {
      if (!knownSourceIds.has(id)) errors.push(`${at}: unknown source ${id}`);
      if (schedule.sourceIds.includes(id)) errors.push(`${at}: ${id} is both shared and provider-specific`);
    }
  }

  const seenCategories = new Set<string>();
  for (const category of schedule.categories) {
    const cat = `${at}.${category.categoryId}`;
    if (!isConsumerCategoryId(category.categoryId)) errors.push(`${cat}: unknown category`);
    if (seenCategories.has(category.categoryId)) errors.push(`${cat}: duplicate category`);
    seenCategories.add(category.categoryId);
    if (!(category.sanctionedLoadBelowKw > 0)) errors.push(`${cat}: invalid sanctionedLoadBelowKw`);
    if (category.bands.length === 0) errors.push(`${cat}: no bands`);
    if (!category.bands.some((b) => b.id === category.defaultBandId)) errors.push(`${cat}: defaultBandId not found`);
    const bandIds = new Set<string>();
    for (const band of category.bands) {
      if (bandIds.has(band.id)) errors.push(`${cat}: duplicate band ${band.id}`);
      bandIds.add(band.id);
      errors.push(...validateBand(band, `${cat}.${band.id}`));
      if (band.eligibility && !knownSourceIds.has(band.eligibility.sourceId)) {
        errors.push(`${cat}.${band.id}: unknown eligibility source`);
      }
    }
  }

  const touIds = new Set<string>();
  for (const tou of schedule.timeOfUse ?? []) {
    const t = `${at}.timeOfUse.${tou.id}`;
    if (touIds.has(tou.id)) errors.push(`${t}: duplicate id`);
    touIds.add(tou.id);
    if (!isConsumerCategoryId(tou.categoryId)) errors.push(`${t}: unknown category`);
    if ((schedule.timeOfUse ?? []).filter((x) => x.categoryId === tou.categoryId).length > 1) {
      errors.push(`${t}: more than one time-of-use tariff for ${tou.categoryId}`);
    }
    for (const [name, value] of [
      ["peakRatePerUnit", tou.peakRatePerUnit],
      ["offPeakRatePerUnit", tou.offPeakRatePerUnit],
      ["fixedChargePerKwPerMonth", tou.fixedChargePerKwPerMonth],
      ["minSanctionedLoadKw", tou.minSanctionedLoadKw],
    ] as const) {
      if (!Number.isFinite(value) || value <= 0) errors.push(`${t}: invalid ${name}`);
    }
    if (!isRate(tou.peakRatePerUnit) || !isRate(tou.offPeakRatePerUnit)) errors.push(`${t}: implausible rate or more than 4 decimals`);
    const share = tou.billingDemand.sanctionedLoadShare;
    if (!(share > 0 && share <= 1)) errors.push(`${t}: sanctionedLoadShare must be in (0, 1]`);
    for (const id of [tou.billingDemand.sourceId, tou.eligibility.sourceId]) {
      if (!knownSourceIds.has(id)) errors.push(`${t}: unknown source ${id}`);
    }
  }
  for (const hours of schedule.peakHours ?? []) {
    if (!schedule.providers.includes(hours.providerId)) errors.push(`${at}.peakHours: ${hours.providerId} is not on this schedule`);
    if (!knownSourceIds.has(hours.sourceId)) errors.push(`${at}.peakHours: unknown source ${hours.sourceId}`);
    if (hours.periods.length === 0) errors.push(`${at}.peakHours: no periods`);
  }
  return errors;
}

/** Two schedules must never cover the same provider + category + bill month. */
export function findOverlappingSchedules(schedules: readonly TariffSchedule[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const s of schedules) {
    if (ids.has(s.id)) errors.push(`duplicate schedule id "${s.id}"`);
    ids.add(s.id);
  }
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];
      const aEnd = a.lastBillingMonth ?? "9999-12";
      const bEnd = b.lastBillingMonth ?? "9999-12";
      const monthsOverlap = a.firstBillingMonth <= bEnd && b.firstBillingMonth <= aEnd;
      if (!monthsOverlap) continue;
      const sharedProvider = a.providers.some((p) => b.providers.includes(p));
      const sharedCategory = a.categories.some((ca) =>
        b.categories.some((cb) => cb.categoryId === ca.categoryId),
      );
      if (sharedProvider && sharedCategory) {
        errors.push(`schedules "${a.id}" and "${b.id}" overlap for the same provider, category and bill months`);
      }
    }
  }
  return errors;
}

export function validateAdjustments(
  data: AdjustmentDataset,
  knownSourceIds: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  if (data.supportedBillingMonths.length === 0) errors.push("adjustments: no supported bill months");
  for (const m of data.supportedBillingMonths) if (!isBillingMonth(m)) errors.push(`adjustments: invalid month ${m}`);
  if (new Set(data.supportedBillingMonths).size !== data.supportedBillingMonths.length) {
    errors.push("adjustments: duplicate supported bill months");
  }
  if (!Number.isInteger(data.fcaBillingLagMonths) || data.fcaBillingLagMonths < 0) {
    errors.push("adjustments: invalid fcaBillingLagMonths");
  }
  if (!isIsoDate(data.lastVerifiedOn)) errors.push("adjustments: invalid lastVerifiedOn");

  const ids = new Set<string>();
  // kind|provider|category|month → adjustment id, to catch double counting.
  const slots = new Map<string, string>();

  for (const adj of data.adjustments) {
    const at = `adjustment "${adj.id}"`;
    if (ids.has(adj.id)) errors.push(`${at}: duplicate id`);
    ids.add(adj.id);
    if (!Number.isFinite(adj.ratePerUnit) || Math.abs(adj.ratePerUnit) > MAX_PLAUSIBLE_RATE) {
      errors.push(`${at}: implausible ratePerUnit`);
    }
    if (adj.billingMonths.length === 0) errors.push(`${at}: no bill months`);
    for (const m of adj.billingMonths) if (!isBillingMonth(m)) errors.push(`${at}: invalid bill month ${m}`);
    if (adj.basis.kind === "units-of-month" && !isBillingMonth(adj.basis.month)) {
      errors.push(`${at}: invalid basis month`);
    }
    if (adj.providers.length === 0) errors.push(`${at}: no providers`);
    for (const p of adj.providers) if (!isProviderId(p)) errors.push(`${at}: unknown provider ${p}`);
    for (const c of adj.categories) if (!isConsumerCategoryId(c)) errors.push(`${at}: unknown category ${c}`);
    if (!isIsoDate(adj.decidedOn)) errors.push(`${at}: invalid decidedOn`);
    if (!isIsoDate(adj.lastVerifiedOn)) errors.push(`${at}: invalid lastVerifiedOn`);
    if (!knownSourceIds.has(adj.sourceId)) errors.push(`${at}: unknown source ${adj.sourceId}`);
    if (!adj.applicability.trim()) errors.push(`${at}: missing applicability`);

    for (const month of adj.billingMonths) {
      for (const provider of adj.providers) {
        for (const category of adj.categories) {
          const key = `${adj.kind}|${provider}|${category}|${month}`;
          const existing = slots.get(key);
          if (existing) errors.push(`${at}: overlaps "${existing}" (${adj.kind}, ${provider}, ${category}, ${month})`);
          else slots.set(key, adj.id);
        }
      }
    }
  }
  return errors;
}

/**
 * Cross-checks every citation against the document it cites:
 * - shared schedule sources must apply to all providers (never one company's notification);
 * - provider-specific sources and peak hours must apply to that provider;
 * - adjustments must cite an FCA or QTA decision of the same kind that applies to their providers.
 */
export function validateSourceAttribution(
  schedules: readonly TariffSchedule[],
  adjustments: AdjustmentDataset,
  sources: readonly SourceDocument[],
): string[] {
  const errors: string[] = [];
  const byId = new Map(sources.map((d) => [d.id, d]));
  const covers = (doc: SourceDocument, provider: string) =>
    doc.appliesTo === "all" || (isProviderId(provider) && doc.appliesTo.includes(provider));

  for (const s of schedules) {
    for (const id of s.sourceIds) {
      const doc = byId.get(id);
      if (!doc) continue;
      if (doc.kind !== "uniform-tariff" || doc.appliesTo !== "all") {
        errors.push(`schedule "${s.id}": shared source ${id} is not a uniform tariff applying to all providers`);
      }
    }
    for (const [provider, ids] of Object.entries(s.providerSourceIds ?? {})) {
      for (const id of ids ?? []) {
        const doc = byId.get(id);
        if (doc && !covers(doc, provider)) errors.push(`schedule "${s.id}": ${id} does not apply to ${provider}`);
        if (doc && (doc.kind === "fca" || doc.kind === "qta")) errors.push(`schedule "${s.id}": ${id} is an adjustment decision, not a tariff source`);
      }
    }
    for (const h of s.peakHours ?? []) {
      const doc = byId.get(h.sourceId);
      if (doc && !covers(doc, h.providerId)) errors.push(`schedule "${s.id}": peak hours source ${h.sourceId} does not apply to ${h.providerId}`);
    }
  }
  for (const a of adjustments.adjustments) {
    const doc = byId.get(a.sourceId);
    if (!doc) continue;
    if (doc.kind !== a.kind) errors.push(`adjustment "${a.id}": cites a ${doc.kind} document for a ${a.kind} adjustment`);
    for (const p of a.providers) if (!covers(doc, p)) errors.push(`adjustment "${a.id}": ${a.sourceId} does not apply to ${p}`);
  }
  return errors;
}
