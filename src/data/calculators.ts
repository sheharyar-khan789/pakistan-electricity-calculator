import { routes } from "@/config/routes";
import { hasAnyCalculatorAvailable, isCalculatorAvailable } from "@/lib/calculator/engine-registry";
import { providerCalculatorPath, providers, type ProviderId } from "./providers";

export type CalculatorStatus = "available" | "in-development";

export type CalculatorEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  providerId?: ProviderId;
  status: CalculatorStatus;
};

/** Status is derived from the engine registry — never set by hand. */
export function providerCalculatorStatus(providerId: ProviderId): CalculatorStatus {
  return isCalculatorAvailable(providerId) ? "available" : "in-development";
}

export function mainCalculatorStatus(): CalculatorStatus {
  return hasAnyCalculatorAvailable() ? "available" : "in-development";
}

export function getMainCalculator(): CalculatorEntry {
  return {
    id: "electricity-bill",
    title: "Electricity Bill Calculator",
    description:
      "Estimate a monthly electricity bill for any supported provider from units consumed or meter readings.",
    href: routes.electricityBillCalculator,
    status: mainCalculatorStatus(),
  };
}

export function getProviderCalculators(): CalculatorEntry[] {
  return providers.map((provider) => ({
    id: `${provider.id}-bill`,
    title: `${provider.shortName} Bill Calculator`,
    description:
      provider.shortName === provider.fullName
        ? `Estimate a ${provider.fullName} electricity bill.`
        : `Estimate a ${provider.fullName} (${provider.shortName}) electricity bill.`,
    href: providerCalculatorPath(provider),
    providerId: provider.id,
    status: providerCalculatorStatus(provider.id),
  }));
}

export const CALCULATOR_STATUS_LABEL: Record<CalculatorStatus, string> = {
  available: "Available",
  "in-development": "In development",
};
