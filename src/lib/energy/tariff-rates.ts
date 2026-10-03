import type { ConsumerCategoryId } from "@/lib/calculator/types";
import { getDefaultBillingMonth } from "@/lib/calculator/engine-registry";
import { formatBillingMonth } from "@/lib/calculator/billing-month";
import { getAdjustmentRows, getSharedSchedule, getSources } from "@/lib/tariffs/overview";
import type { PeriodicAdjustment, Slab } from "@/lib/tariffs/types";

/**
 * Per-unit rates the appliance and AC tools offer as an optional starting
 * point. They are read from the verified tariff data, never typed here.
 *
 * Each option is the variable charge for ONE slab: base energy rate plus the
 * FCA and QTA notified for the bill month (where they apply to that band).
 * It excludes fixed charges and taxes, and the slab that applies depends on
 * the household's total monthly units, so it is labelled an estimate.
 */
export type RateOption = {
  id: string;
  /** e.g. "Residential un-protected · 201–300 units a month". */
  label: string;
  group: string;
  /** Rs/kWh, rounded to the paisa. */
  ratePerUnit: number;
  baseRate: number;
  adjustmentsPerUnit: number;
};

export type RateOptions = {
  options: RateOption[];
  billingMonthLabel: string;
  /** e.g. "the quarterly tariff adjustment (QTA)" — only adjustments actually notified and added. */
  adjustmentsText: string;
  /** Adjustments expected but not yet notified for the bill month, e.g. ["fuel charges adjustment (FCA)"]. */
  pendingText: string | null;
  effectiveFrom: string;
  scheduleTitle: string;
  references: string[];
};

const slabLabel = (s: Slab) =>
  s.toUnits === null ? `above ${s.fromUnits - 1} units a month` : `${s.fromUnits === 0 ? 1 : s.fromUnits}–${s.toUnits} units a month`;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function adjustmentFor(a: PeriodicAdjustment | null, categoryId: ConsumerCategoryId, bandId: string): number {
  if (!a || !a.categories.includes(categoryId) || a.excludedBandIds.includes(bandId)) return 0;
  return a.ratePerUnit;
}

/** Null when there is no single verified schedule shared by every covered provider. */
export function getRateOptions(): RateOptions | null {
  const month = getDefaultBillingMonth();
  if (!month) return null;
  const schedule = getSharedSchedule(month);
  if (!schedule) return null;
  const row = getAdjustmentRows().find((r) => r.billingMonth === month);

  const options: RateOption[] = [];
  for (const category of schedule.categories) {
    const categoryName = category.categoryId === "residential" ? "Residential" : category.categoryId === "commercial" ? "Commercial" : null;
    if (!categoryName) continue;
    for (const band of category.bands) {
      const adjustments =
        adjustmentFor(row?.fca ?? null, category.categoryId, band.id) +
        adjustmentFor(row?.qta ?? null, category.categoryId, band.id);
      const group = category.bands.length > 1 ? `${categoryName} · ${band.label}` : categoryName;
      for (const slab of band.slabs) {
        options.push({
          id: `${band.id}-${slab.fromUnits}`,
          group,
          label: `${group} · ${slabLabel(slab)}`,
          baseRate: slab.ratePerUnit,
          adjustmentsPerUnit: round2(adjustments),
          ratePerUnit: round2(slab.ratePerUnit + adjustments),
        });
      }
    }
  }

  const adjustmentSources = [row?.fca?.sourceId, row?.qta?.sourceId].filter((id): id is string => Boolean(id));
  const names = { fca: "fuel charges adjustment (FCA)", qta: "quarterly tariff adjustment (QTA)" } as const;
  const present = (["fca", "qta"] as const).filter((k) => row?.[k]);
  const missing = (["fca", "qta"] as const).filter((k) => !row?.[k]);
  return {
    options,
    billingMonthLabel: formatBillingMonth(month),
    adjustmentsText: present.length ? present.map((k) => names[k]).join(" and ") : "",
    pendingText: missing.length ? missing.map((k) => names[k]).join(" and ") : null,
    effectiveFrom: schedule.effectiveFrom,
    scheduleTitle: schedule.title,
    references: getSources([...schedule.sourceIds, ...adjustmentSources]).map((s) => s.reference),
  };
}
