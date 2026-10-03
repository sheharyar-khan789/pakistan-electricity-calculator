import type { ProviderId } from "@/data/providers";
import type { IdentifierErrorCode, IdentifierType } from "@/lib/bill-check/types";
import type { ConsumerCategoryId } from "@/lib/calculator/types";
import type { ToolId } from "@/data/tools";

/**
 * Privacy-conscious analytics abstraction.
 *
 * Event payloads are typed so that identifiers (reference numbers, customer
 * IDs, account numbers), bill amounts and free text CANNOT be passed. No
 * analytics provider is configured yet: events go nowhere until a sink is
 * registered (and the privacy policy is updated first).
 */
export type AnalyticsEvent =
  | { name: "provider_selected"; providerId: ProviderId; context: "bill-check" | "calculator" }
  | { name: "bill_check_started"; providerId: ProviderId; identifierType: IdentifierType }
  | { name: "bill_check_redirected"; providerId: ProviderId; identifierType: IdentifierType }
  | { name: "bill_check_failed"; providerId: ProviderId | "none"; reason: IdentifierErrorCode }
  | { name: "guide_interaction"; guide: "reference-number" | "understand-your-bill"; action: "bill_check_link" | "calculator_link" }
  | { name: "calculator_started"; providerId: ProviderId; categoryId: ConsumerCategoryId }
  | { name: "calculator_completed"; providerId: ProviderId; categoryId: ConsumerCategoryId; outcome: "success" | "unavailable" | "invalid" | "error" }
  /** Energy tools: only which tool and the outcome — never watts, readings, rates or results. */
  | { name: "tool_selected"; tool: ToolId; from: "home" | "calculators" | "related-tools" }
  | { name: "calculator_started"; tool: Exclude<ToolId, "bill-calculator"> }
  | { name: "calculator_completed"; tool: Exclude<ToolId, "bill-calculator">; outcome: "success" | "invalid" };

export type AnalyticsSink = (event: AnalyticsEvent) => void;

let sink: AnalyticsSink | null = null;

/** Register a provider later, e.g. in a client component once consent exists. */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

export function track(event: AnalyticsEvent): void {
  try {
    sink?.(event);
  } catch {
    // Analytics must never break the product.
  }
}
