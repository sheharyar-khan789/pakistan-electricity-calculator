import { PROVIDER_IDS } from "@/data/providers";
import { loadTariffData, type LoadedTariffData } from "@/lib/tariffs";
import { billingMonthOf, pickDefaultBillingMonth } from "./billing-month";
import { createScheduleEngine, findSchedule } from "./schedule-engine";
import type { CalculationEngine, CategoryRequirements, ConsumerCategoryId, ProviderId } from "./types";

/**
 * Registry of calculation engines, keyed by provider.
 *
 * Engines are built ONLY from tariff data that passes validation
 * (`src/lib/tariffs/validate.ts`). A provider gets an engine only when a
 * verified schedule covers it for a supported bill month. If the data is
 * malformed, no engines are registered and every calculator shows its
 * "not available" state instead of numbers.
 *
 * Provider availability badges, page indexing, sitemap entries and the
 * calculator UI all derive from this registry.
 */
export function buildEngines(loaded: LoadedTariffData): Partial<Record<ProviderId, CalculationEngine>> {
  if (!loaded.ok) {
    console.error("Tariff data failed validation; calculators are disabled.", loaded.errors);
    return {};
  }
  const engines: Partial<Record<ProviderId, CalculationEngine>> = {};
  for (const providerId of PROVIDER_IDS) {
    const covered = loaded.data.adjustments.supportedBillingMonths.some((m) =>
      findSchedule(loaded.data.schedules, providerId, m),
    );
    if (covered) engines[providerId] = createScheduleEngine(providerId, loaded.data);
  }
  return engines;
}

const engines = buildEngines(loadTariffData());

export function getEngine(providerId: ProviderId): CalculationEngine | undefined {
  return engines[providerId];
}

export function isCalculatorAvailable(providerId: ProviderId): boolean {
  return getEngine(providerId) !== undefined;
}

export function hasAnyCalculatorAvailable(): boolean {
  return Object.keys(engines).length > 0;
}

/**
 * Form requirements for a category. With a provider selected, its engine
 * decides. Before a provider is chosen, the form previews the requirements
 * only if every registered engine declares identical ones.
 */
export function getCategoryRequirements(
  categoryId: ConsumerCategoryId,
  providerId?: ProviderId,
): CategoryRequirements | null {
  if (providerId) return getEngine(providerId)?.requirementsFor(categoryId) ?? null;
  const all = Object.values(engines).map((e) => e.requirementsFor(categoryId));
  if (all.length === 0 || all.some((r) => r === null)) return null;
  const first = JSON.stringify(all[0]);
  return all.every((r) => JSON.stringify(r) === first) ? all[0] : null;
}

/** Bill month to preselect, given today's date. */
export function getDefaultBillingMonth(today: Date = new Date()): string | null {
  const months = new Set<string>();
  for (const engine of Object.values(engines)) {
    for (const category of engine.supportedCategories) {
      engine.requirementsFor(category)?.billingMonths.forEach((m) => months.add(m.value));
    }
  }
  return pickDefaultBillingMonth([...months], billingMonthOf(today));
}
