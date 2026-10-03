import { PROVIDER_IDS, type ProviderId } from "@/data/providers";
import { formatBillingMonth } from "@/lib/calculator/billing-month";
import { findSchedule } from "@/lib/calculator/schedule-engine";
import { adjustmentData, getSourceDocument, loadTariffData, tariffSchedules } from "./index";
import type { PeriodicAdjustment, SourceDocument, TariffSchedule } from "./types";

/** Read-only views of verified tariff data for display on pages. */

export type AdjustmentRow = {
  billingMonth: string;
  billingMonthLabel: string;
  fca: PeriodicAdjustment | null;
  qta: PeriodicAdjustment | null;
};

const dataIsValid = loadTariffData().ok;

/** Schedule in force for a provider in a bill month (only if the data validated). */
export function getScheduleFor(providerId: ProviderId, billingMonth: string): TariffSchedule | null {
  if (!dataIsValid) return null;
  return findSchedule(tariffSchedules, providerId, billingMonth) ?? null;
}

/** Rows for one provider, or (no provider) adjustments applying to every provider. */
export function getAdjustmentRows(providerId?: ProviderId): AdjustmentRow[] {
  if (!dataIsValid) return [];
  const pick = (kind: PeriodicAdjustment["kind"], month: string) =>
    adjustmentData.adjustments.find(
      (a) => a.kind === kind && a.billingMonths.includes(month) &&
        (providerId ? a.providers.includes(providerId) : coveredProviders().every((p) => a.providers.includes(p))),
    ) ?? null;
  return [...adjustmentData.supportedBillingMonths].sort().map((month) => ({
    billingMonth: month,
    billingMonthLabel: formatBillingMonth(month),
    fca: pick("fca", month),
    qta: pick("qta", month),
  }));
}

export function getSources(ids: readonly string[]): SourceDocument[] {
  return ids.map(getSourceDocument).filter((d): d is SourceDocument => d !== undefined);
}

/**
 * Source ids behind a schedule for one provider: the shared documents plus
 * that provider's own. Without a provider, only the shared documents.
 */
export function scheduleSourceIds(schedule: TariffSchedule, providerId?: ProviderId): string[] {
  return [...schedule.sourceIds, ...((providerId && schedule.providerSourceIds?.[providerId]) || [])];
}

export type SourceUse = "tariff" | "eligibility" | "fca" | "qta" | "peak-hours";

export type SourceUsage = {
  document: SourceDocument;
  /** Providers the document is attributed to, derived from the data that cites it. */
  providers: ProviderId[];
  uses: SourceUse[];
  /** Bill months, for adjustment decisions. */
  billingMonths: string[];
};

/**
 * Every source document the live data relies on, with the providers each one
 * applies to. Applicability is derived from where the data cites it, never
 * typed separately, so a document cannot be shown against the wrong provider.
 */
export function getSourceUsage(): SourceUsage[] {
  if (!dataIsValid) return [];
  const usage = new Map<string, { providers: Set<ProviderId>; uses: Set<SourceUse>; months: Set<string> }>();
  const add = (id: string, providers: readonly ProviderId[], use: SourceUse, months: readonly string[] = []) => {
    const entry = usage.get(id) ?? { providers: new Set(), uses: new Set(), months: new Set() };
    providers.forEach((p) => entry.providers.add(p));
    entry.uses.add(use);
    months.forEach((m) => entry.months.add(m));
    usage.set(id, entry);
  };
  for (const s of tariffSchedules) {
    s.sourceIds.forEach((id) => add(id, s.providers, "tariff"));
    for (const [providerId, ids] of Object.entries(s.providerSourceIds ?? {}) as [ProviderId, readonly string[]][]) {
      ids.forEach((id) => add(id, [providerId], "tariff"));
    }
    // Definitions are quoted wording, not a tariff: citing them does not make a
    // company's notification apply to other providers.
    s.categories.forEach((c) => c.bands.forEach((b) => b.eligibility && add(b.eligibility.sourceId, [], "eligibility")));
    for (const t of s.timeOfUse ?? []) {
      add(t.billingDemand.sourceId, s.providers, "tariff");
      add(t.eligibility.sourceId, [], "eligibility");
    }
    for (const h of s.peakHours ?? []) add(h.sourceId, [h.providerId], "peak-hours");
  }
  adjustmentData.adjustments.forEach((a) => add(a.sourceId, a.providers, a.kind, a.billingMonths));

  return [...usage.entries()].flatMap(([id, entry]) => {
    const document = getSourceDocument(id);
    if (!document) return [];
    return [{
      document,
      providers: PROVIDER_IDS.filter((p) => entry.providers.has(p)),
      uses: [...entry.uses],
      billingMonths: [...entry.months].sort(),
    }];
  });
}

/** Every source document the live data relies on, deduplicated. */
export function getAllUsedSources(): SourceDocument[] {
  return getSourceUsage().map((u) => u.document);
}

export const adjustmentsLastVerifiedOn = adjustmentData.lastVerifiedOn;

/** Providers that have any verified tariff schedule. */
export function coveredProviders(): ProviderId[] {
  return PROVIDER_IDS.filter((id) => tariffSchedules.some((s) => s.providers.includes(id)));
}

/**
 * The schedule shared by every provider that has verified tariff data, in a
 * bill month, or null if they differ. Used for site-wide rate tables.
 */
export function getSharedSchedule(billingMonth: string): TariffSchedule | null {
  const schedules = coveredProviders().map((id) => getScheduleFor(id, billingMonth));
  const first = schedules[0];
  return first && schedules.every((s) => s?.id === first.id) ? first : null;
}
