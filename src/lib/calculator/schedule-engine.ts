import { getConsumerCategory } from "@/data/consumer-categories";
import { getProvider, type ProviderId } from "@/data/providers";
import type { TariffDataset } from "@/lib/tariffs";
import type { CategoryTariff, TariffSchedule } from "@/lib/tariffs/types";
import { formatBillingMonth } from "./billing-month";
import { calculateEstimate } from "./estimate";
import type {
  CalculationEngine,
  CalculationInput,
  CalculationOutcome,
  CategoryRequirements,
  ConsumerCategoryId,
  TariffVersion,
} from "./types";

/** The single schedule covering provider + bill month, or undefined. */
export function findSchedule(
  schedules: readonly TariffSchedule[],
  providerId: ProviderId,
  billingMonth: string,
): TariffSchedule | undefined {
  return schedules.find(
    (s) =>
      s.providers.includes(providerId) &&
      s.firstBillingMonth <= billingMonth &&
      (s.lastBillingMonth === null || billingMonth <= s.lastBillingMonth),
  );
}

function findCategory(schedule: TariffSchedule, categoryId: ConsumerCategoryId): CategoryTariff | undefined {
  return schedule.categories.find((c) => c.categoryId === categoryId);
}

/**
 * Engine driven entirely by versioned tariff data. Providers with different
 * rules get different schedules; this code does not assume they are equal.
 */
export function createScheduleEngine(providerId: ProviderId, data: TariffDataset): CalculationEngine {
  const months = [...data.adjustments.supportedBillingMonths].sort();
  const monthsWithTariff = months.filter((m) => findSchedule(data.schedules, providerId, m));
  const latestMonth = monthsWithTariff.at(-1);
  const latestSchedule = latestMonth ? findSchedule(data.schedules, providerId, latestMonth) : undefined;
  const supportedCategories = latestSchedule ? latestSchedule.categories.map((c) => c.categoryId) : [];
  const getSource = (id: string) => data.sources.find((s) => s.id === id);

  function requirementsFor(categoryId: ConsumerCategoryId): CategoryRequirements | null {
    const category = latestSchedule && findCategory(latestSchedule, categoryId);
    if (!category) return null;
    return {
      categoryId,
      bands: category.bands.map((b) => ({
        id: b.id,
        label: b.label,
        description: b.description,
        eligibility: b.eligibility?.text,
      })),
      defaultBandId: category.defaultBandId,
      sanctionedLoad: { maxKwExclusive: category.sanctionedLoadBelowKw },
      billingMonths: monthsWithTariff
        .filter((m) => {
          const s = findSchedule(data.schedules, providerId, m);
          return s !== undefined && findCategory(s, categoryId) !== undefined;
        })
        .map((m) => ({ value: m, label: formatBillingMonth(m) })),
    };
  }

  function tariffFor(categoryId: ConsumerCategoryId, billingMonth: string): TariffVersion | null {
    const schedule = findSchedule(data.schedules, providerId, billingMonth);
    const category = schedule && findCategory(schedule, categoryId);
    if (!schedule || !category) return null;
    const band = category.bands.find((b) => b.id === category.defaultBandId) ?? category.bands[0];
    return {
      id: schedule.id,
      title: schedule.title,
      providerId,
      consumerCategoryId: categoryId,
      tariffReference: band.tariffReference,
      effectiveFrom: schedule.effectiveFrom,
      effectiveTo: schedule.effectiveTo ?? undefined,
      lastVerifiedOn: schedule.lastVerifiedOn,
      sources: [...schedule.sourceIds, ...(schedule.providerSourceIds?.[providerId] ?? [])]
        .map(getSource)
        .filter((d) => d !== undefined)
        .map((d) => ({ reference: d.reference, title: d.title, publisher: d.publisher, url: d.url, publishedOn: d.publishedOn })),
    };
  }

  function calculate(input: CalculationInput): CalculationOutcome {
    if (input.providerId !== providerId) {
      return { status: "invalid", errors: { providerId: "Select a provider from the list." } };
    }
    const schedule = findSchedule(data.schedules, providerId, input.billingMonth);
    if (!schedule) {
      return {
        status: "unavailable",
        reason: "tariff-data-missing",
        message: `No verified ${getProvider(providerId).shortName} tariff is available for ${formatBillingMonth(input.billingMonth)} bills.`,
      };
    }
    const category = findCategory(schedule, input.consumerCategoryId);
    if (!category) {
      return {
        status: "unavailable",
        reason: "category-not-supported",
        message: `${getConsumerCategory(input.consumerCategoryId).label} estimates are not available yet. Only residential and commercial connections below 5 kW are supported at the moment.`,
      };
    }
    const band = category.bands.find((b) => b.id === (input.bandId ?? category.defaultBandId));
    if (!band) return { status: "invalid", errors: { bandId: "Choose a consumer status from the list." } };

    return calculateEstimate(input, {
      providerId,
      schedule,
      category,
      band,
      adjustments: data.adjustments,
      getSource,
    });
  }

  return { providerId, supportedCategories, requirementsFor, tariffFor, calculate };
}
