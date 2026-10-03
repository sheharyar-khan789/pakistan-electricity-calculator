import { getProvider } from "@/data/providers";
import type { FaqEntry } from "@/lib/seo/schema";
import type { BillCheckProvider, IdentifierRule } from "./types";

/**
 * Page copy and metadata derived from verified configuration only. Nothing
 * here states a fact that is not in the provider's config or its sources.
 */

export function host(config: BillCheckProvider): string {
  return new URL(config.lookup.url).host;
}

/** Official page without protocol, e.g. "bill.pitc.com.pk/iescobill". */
export function displayDestination(config: BillCheckProvider): string {
  const url = new URL(config.lookup.url);
  return `${url.host}${url.pathname.replace(/\/$/, "")}`;
}

export function describeRule(rule: IdentifierRule): string {
  return `${rule.digits} digits${rule.suffixes ? `, followed on your bill by ${rule.suffixes.join(" or ")}` : ""}`;
}

export function identifierSummary(config: BillCheckProvider): string {
  return config.identifiers.map((r) => `${r.label} (${r.digits} digits)`).join(" or ");
}

/** "Reference Number & Customer ID" — the identifiers the official page accepts. */
export function identifierLabels(config: BillCheckProvider): string {
  return config.identifiers.map((r) => r.label).join(" & ");
}

/** Title: "<Provider> Bill Check Online: <identifiers>". */
export function billCheckTitle(config: BillCheckProvider): string {
  return `${getProvider(config.providerId).shortName} Bill Check Online: ${identifierLabels(config)}`;
}

export function billCheckDescription(config: BillCheckProvider): string {
  const name = getProvider(config.providerId).shortName;
  const ids = config.identifiers
    .map((r) => `${r.digits}-digit ${r.label}`)
    .join(" or ");
  return `Check your ${name} electricity bill online with your ${ids}. We check it and open ${name}’s official bill page.`;
}

export function getBillCheckFaq(config: BillCheckProvider): FaqEntry[] {
  const provider = getProvider(config.providerId);
  const name = provider.shortName;
  const site = host(config);
  const ref = config.identifiers.find((r) => r.type === "reference-number");
  const customer = config.identifiers.find((r) => r.type === "customer-id");
  const account = config.identifiers.find((r) => r.type === "account-number");
  const faq: FaqEntry[] = [
    {
      question: `How do I check my ${name} bill online?`,
      answer: `Enter your ${identifierSummary(config)} and choose Check Bill. We check the format, then open ${name}’s official bill page on ${site}, where you enter the number${config.lookup.captcha ? " and a CAPTCHA code" : ""} to view your current bill.`,
    },
  ];
  if (ref) {
    faq.push({
      question: `What is a ${name} reference number and where do I find it?`,
      answer: `It is the number that identifies your connection, printed on your ${name} electricity bill. ${name}’s official bill page asks for the ${ref.digits}-digit reference number and, separately, the ${ref.suffixes?.join(" or ") ?? ""} letter printed after it on your bill.`,
    });
  }
  if (customer) {
    faq.push({
      question: `Can I check my ${name} bill with my Customer ID?`,
      answer: `Yes. ${name}’s official bill page also accepts a ${customer.digits}-digit Customer ID. Choose “Customer ID” in the checker above before entering it.`,
    });
  }
  if (account) {
    faq.push({
      question: `Where is my ${name} account number?`,
      answer: `${account.whereToFind ?? `It is printed on your ${name} bill.`} Enter all ${account.digits} digits.`,
    });
  }
  faq.push(
    {
      question: `Where does the ${name} bill checker take me?`,
      answer: `To ${name}’s official bill page at ${displayDestination(config)}, operated by ${config.lookup.operator}. It opens in a new tab and your bill is shown there, not on this website.`,
    },
    {
      question: `Can I download or print a duplicate ${name} bill?`,
      answer: `Your bill is shown on ${name}’s official page. If that page offers a print or download option, use it; otherwise use your browser’s print function, which can also save the page as a PDF.`,
    },
    {
      question: `Is this website ${name}?`,
      answer: `No. This is an independent website that helps you reach ${name}’s official bill service. Your number is checked in your browser and is not sent to or stored by this website. For complaints or connection requests, contact ${name} directly.`,
    },
  );
  return faq;
}
