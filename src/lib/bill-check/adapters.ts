import { getProvider } from "@/data/providers";
import type { BillCheckProvider, LookupMethod, LookupStep, NormalizedIdentifier, PreparedLookup } from "./types";

/**
 * Lookup adapters: one per official lookup method. Each turns a validated
 * identifier into an honest hand-off to the official page — the URL, the
 * value to paste, and the steps to finish there. No adapter submits data,
 * fills forms on another site or bypasses any security step.
 */
type Adapter = (provider: BillCheckProvider, id: NormalizedIdentifier) => readonly LookupStep[];

const pitcWebBill: Adapter = (provider, id) => {
  const rule = provider.identifiers.find((r) => r.type === id.type)!;
  const steps = [
    `On the official page, select “${rule.officialLabel}”.`,
    `Paste or type ${id.digits} in the box.`,
  ];
  if (id.type === "reference-number") {
    steps.push(
      id.suffix
        ? `In the small list next to the box, choose “${id.suffix}”.`
        : "In the small list next to the box, choose the U or R letter printed after your reference number on the bill.",
    );
  }
  steps.push("Press “Search” to see your current bill.");
  return steps;
};

const keDuplicateBill: Adapter = (provider, id) => {
  const rule = provider.identifiers.find((r) => r.type === id.type)!;
  return [
    `On K-Electric’s page, enter ${id.digits} in “${rule.officialLabel}”.`,
    "Type the CAPTCHA code shown on the page (letters are case sensitive).",
    "Submit the form to view your bill.",
  ];
};

const adapters: Record<LookupMethod, Adapter> = {
  "pitc-web-bill": pitcWebBill,
  "ke-duplicate-bill": keDuplicateBill,
};

export function prepareLookupFor(provider: BillCheckProvider, id: NormalizedIdentifier): PreparedLookup {
  const url = new URL(provider.lookup.url);
  return {
    providerId: provider.providerId,
    identifier: id,
    destinationUrl: url.toString(),
    destinationHost: url.host,
    operator: provider.lookup.operator,
    copyValue: id.digits,
    steps: [
      `Opening the official ${getProvider(provider.providerId).shortName} bill page (${url.host}) in a new tab.`,
      ...adapters[provider.lookup.method](provider, id),
    ],
  };
}
