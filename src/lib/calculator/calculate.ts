import { getConsumerCategory } from "@/data/consumer-categories";
import { getProvider } from "@/data/providers";
import { getEngine } from "./engine-registry";
import type { CalculationInput, CalculationOutcome } from "./types";

/**
 * Single entry point the UI calls. It never fabricates numbers: when no
 * verified engine exists for the provider/category it returns `unavailable`.
 * Calculation is pure and runs in the browser; it is async so a future
 * engine could load data lazily without changing callers.
 */
export async function calculateBill(input: CalculationInput): Promise<CalculationOutcome> {
  const provider = getProvider(input.providerId);
  const engine = getEngine(input.providerId);

  if (!engine) {
    return {
      status: "unavailable",
      reason: "engine-not-connected",
      message: `${provider.shortName} estimates are not available yet because verified tariff data for ${provider.shortName} is not connected.`,
    };
  }

  if (!engine.supportedCategories.includes(input.consumerCategoryId)) {
    const category = getConsumerCategory(input.consumerCategoryId);
    return {
      status: "unavailable",
      reason: "category-not-supported",
      message: `${category.label} estimates for ${provider.shortName} are not available yet. Only residential and commercial connections below 5 kW are supported at the moment.`,
    };
  }

  try {
    return engine.calculate(input);
  } catch {
    return {
      status: "error",
      message: "Something went wrong while calculating your estimate. Please try again.",
    };
  }
}
