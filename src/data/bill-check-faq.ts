import { getProvider } from "@/data/providers";
import { listBillCheckProviders } from "@/lib/bill-check/registry";
import type { FaqEntry } from "@/lib/seo/schema";

/** General bill-check FAQ, derived from verified provider configuration. */
export function getBillCheckHubFaq(): FaqEntry[] {
  const supported = listBillCheckProviders().filter((p) => p.config?.status === "supported");
  const pitcNames = supported.filter((p) => p.config?.lookup.method === "pitc-web-bill").map((p) => getProvider(p.providerId).shortName);
  const lesco = supported.find((p) => p.providerId === "lesco")?.config;
  const lescoCustomerDigits = lesco?.identifiers.find((r) => r.type === "customer-id")?.digits;
  const ke = supported.find((p) => p.providerId === "ke")?.config;
  const keDigits = ke?.identifiers.find((r) => r.type === "account-number")?.digits;

  return [
    {
      question: "How can I check my electricity bill online in Pakistan?",
      answer:
        "Select your electricity provider, enter the number from your bill and choose Check Bill. We check the format and open your provider’s official bill page, where you enter the number to see your current bill.",
    },
    {
      question: "Which number do I need to check my bill?",
      answer: `For ${pitcNames.join(", ")}, use the 14-digit reference number (followed by U or R on your bill) or your Customer ID, which is ${lescoCustomerDigits ?? 11} digits for LESCO and 10 digits for the others. For K-Electric, use the ${keDigits ?? 13}-digit account number.`,
    },
    {
      question: "Is this an official electricity company website?",
      answer:
        "No. This is an independent website. We send you to official bill pages: bill.pitc.com.pk, run by the Power Information Technology Company (PITC), for ex-WAPDA distribution companies, and ke.com.pk for K-Electric.",
    },
    {
      question: "Why do I have to enter my number again on the official page?",
      answer:
        "Official bill pages only accept numbers typed on their own page, which protects your account. We copy your number so you can paste it. K-Electric’s page also asks for a CAPTCHA code.",
    },
    {
      question: "Does this website store my reference number?",
      answer:
        "No. Your number is checked in your browser and is not sent to our servers, saved or included in any link.",
    },
    {
      question: "Is the bill calculator the same as my actual bill?",
      answer:
        "No. The calculator gives an estimate from official tariff rates, before taxes. The amount you must pay is the one on your official bill.",
    },
  ];
}
