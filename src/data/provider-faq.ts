import { formatDate } from "@/lib/format";
import { getScheduleFor, getSources } from "@/lib/tariffs/overview";
import type { FaqEntry } from "@/lib/seo/schema";
import { getProvider, type ProviderId } from "./providers";

/**
 * FAQ for a provider calculator page, built only from verified tariff data.
 * Returns an empty list when no verified schedule exists, so nothing is
 * claimed for unsupported providers.
 */
export function getProviderFaq(providerId: ProviderId, billingMonth: string): FaqEntry[] {
  const schedule = getScheduleFor(providerId, billingMonth);
  if (!schedule) return [];
  const provider = getProvider(providerId);
  const name = provider.shortName;
  const references = getSources(schedule.sourceIds)
    .filter((d) => d.id === "sro-279-2026")
    .map((d) => d.reference);
  const notification = references[0] ?? "the applicable notification";
  const own = providerId === "ke" ? undefined : getSources(schedule.providerSourceIds?.[providerId] ?? [])[0]?.reference;
  const ownNote = own ? ` It amends ${name}’s own schedule of tariffs, notified in ${own}.` : "";

  const tariffAnswer =
    providerId === "ke"
      ? `K-Electric consumers are charged the same government-applicable tariff as the ex-WAPDA distribution companies, as stated in NEPRA’s notification S.R.O. 1643(I)/2026. The current rates were notified in ${notification} and apply from ${formatDate(schedule.effectiveFrom)}.`
      : `${name} consumers are billed under the uniform government-applicable tariff for ex-WAPDA distribution companies. The current rates were notified in ${notification} and apply from ${formatDate(schedule.effectiveFrom)}.${ownNote}`;

  return [
    {
      question: `Which tariff does the ${name} bill calculator use?`,
      answer: tariffAnswer,
    },
    {
      question: `Does the ${name} estimate include taxes?`,
      answer:
        "No. The estimate covers electricity charges, fixed charges and the adjustments notified by NEPRA for your bill month. Taxes and duties, such as General Sales Tax and electricity duty, depend on your province and tax status and are not included, so your actual bill will be higher.",
    },
    {
      question: `How do I know my sanctioned load and protected status for ${name}?`,
      answer: `Your sanctioned load (in kW) is printed on your ${name} bill. Protected status is decided by ${name} using official criteria; if you are unsure of yours, check with ${name}. NEPRA’s terms describe protected consumers as non-time-of-use residential consumers using up to 200 units a month consistently for the past 6 months.`,
    },
  ];
}
