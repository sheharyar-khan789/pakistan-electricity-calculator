import type { FaqEntry } from "@/lib/seo/schema";
import { isCalculatorAvailable } from "@/lib/calculator/engine-registry";
import { providers } from "./providers";

/** Only providers whose calculator has verified tariff data. */
const providerNames = providers.filter((p) => isCalculatorAvailable(p.id)).map((p) => p.shortName);
const providerList = `${providerNames.slice(0, -1).join(", ")} and ${providerNames.at(-1)}`;

/**
 * Homepage FAQ. Rendered visibly and used verbatim for FAQPage structured
 * data — keep answers factual and free of unverified tariff claims.
 */
export const homeFaq: readonly FaqEntry[] = [
  {
    question: "How does the electricity bill calculator work?",
    answer:
      "You choose your electricity provider and consumer type, then enter the units you used in the billing month or your previous and current meter readings. You also enter your sanctioned load and bill month. The calculator applies the official tariff for that provider, category and month and shows an estimated bill with a breakdown of electricity charges, fixed charges and monthly adjustments. Taxes and duties are not included.",
  },
  {
    question: "Which electricity providers are supported?",
    answer: `Estimates are available for ${providerList}, for residential and commercial connections: slab tariffs below 5 kW, and time-of-use tariffs at 5 kW and above in the separate TOU calculator. Industrial, agricultural and prepaid connections are not supported yet. Each provider page shows the tariff it uses and the official source.`,
  },
  {
    question: "Is the result an official electricity bill?",
    answer:
      "No. This is an independent website and is not affiliated with NEPRA, any electricity distribution company or any government body. Results are estimates to help you plan and understand your bill. The amount you must pay is always the amount on the bill issued by your electricity provider.",
  },
  {
    question: "Why can an estimated bill differ from the actual bill?",
    answer:
      "An actual bill can include items an estimate cannot know about, such as arrears, late payment surcharges, instalments, billing corrections, the exact length of your billing cycle and adjustments announced after the tariff data was last verified. Some taxes can also depend on your individual circumstances.",
  },
  {
    question: "Where does tariff information come from?",
    answer:
      "Tariff rates and adjustments come only from official notifications and decisions published by NEPRA and the Government of Pakistan. Every estimate shows the tariff version it used, links to its source documents and the date the data was last verified. The Sources page lists every document used.",
  },
];
