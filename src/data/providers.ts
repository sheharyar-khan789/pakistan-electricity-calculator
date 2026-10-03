/**
 * Electricity providers (distribution companies) in Pakistan.
 *
 * Only stable, verifiable identity facts live here: names, headquarters city
 * and the official website. Official websites were checked to load and to
 * identify themselves as the named company on `officialWebsite.verifiedOn`;
 * a provider whose site could not be confirmed has `officialWebsite: null`.
 *
 * Tariff data does NOT belong in this file — see `src/lib/calculator`.
 */

export const PROVIDER_IDS = [
  "lesco",
  "iesco",
  "mepco",
  "fesco",
  "gepco",
  "pesco",
  "hesco",
  "sepco",
  "qesco",
  "tesco",
  "hazeco",
  "ke",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type Region =
  | "Punjab"
  | "Islamabad Capital Territory"
  | "Khyber Pakhtunkhwa"
  | "Sindh"
  | "Balochistan";

export type Provider = {
  id: ProviderId;
  /** Abbreviation used in headings and buttons. */
  shortName: string;
  fullName: string;
  /** URL path segment of the provider's calculator page (no leading slash). */
  calculatorSlug: string;
  headquarters: { city: string; region: Region };
  officialWebsite: { url: string; verifiedOn: string } | null;
};

const WEBSITES_VERIFIED_ON = "2026-10-01";

export const providers: readonly Provider[] = [
  {
    id: "lesco",
    shortName: "LESCO",
    fullName: "Lahore Electric Supply Company",
    calculatorSlug: "lesco-bill-calculator",
    headquarters: { city: "Lahore", region: "Punjab" },
    officialWebsite: { url: "https://www.lesco.gov.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "iesco",
    shortName: "IESCO",
    fullName: "Islamabad Electric Supply Company",
    calculatorSlug: "iesco-bill-calculator",
    headquarters: { city: "Islamabad", region: "Islamabad Capital Territory" },
    officialWebsite: { url: "https://www.iesco.com.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "mepco",
    shortName: "MEPCO",
    fullName: "Multan Electric Power Company",
    calculatorSlug: "mepco-bill-calculator",
    headquarters: { city: "Multan", region: "Punjab" },
    officialWebsite: { url: "https://mepco.com.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "fesco",
    shortName: "FESCO",
    fullName: "Faisalabad Electric Supply Company",
    calculatorSlug: "fesco-bill-calculator",
    headquarters: { city: "Faisalabad", region: "Punjab" },
    officialWebsite: { url: "https://www.fesco.com.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "gepco",
    shortName: "GEPCO",
    fullName: "Gujranwala Electric Power Company",
    calculatorSlug: "gepco-bill-calculator",
    headquarters: { city: "Gujranwala", region: "Punjab" },
    officialWebsite: { url: "https://www.gepco.com.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "pesco",
    shortName: "PESCO",
    fullName: "Peshawar Electric Supply Company",
    calculatorSlug: "pesco-bill-calculator",
    headquarters: { city: "Peshawar", region: "Khyber Pakhtunkhwa" },
    officialWebsite: null,
  },
  {
    id: "hesco",
    shortName: "HESCO",
    fullName: "Hyderabad Electric Supply Company",
    calculatorSlug: "hesco-bill-calculator",
    headquarters: { city: "Hyderabad", region: "Sindh" },
    officialWebsite: { url: "https://hesco.gov.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "sepco",
    shortName: "SEPCO",
    fullName: "Sukkur Electric Power Company",
    calculatorSlug: "sepco-bill-calculator",
    headquarters: { city: "Sukkur", region: "Sindh" },
    officialWebsite: { url: "http://www.sepco.com.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "qesco",
    shortName: "QESCO",
    fullName: "Quetta Electric Supply Company",
    calculatorSlug: "qesco-bill-calculator",
    headquarters: { city: "Quetta", region: "Balochistan" },
    officialWebsite: { url: "http://www.qesco.com.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "tesco",
    shortName: "TESCO",
    fullName: "Tribal Areas Electricity Supply Company",
    calculatorSlug: "tesco-bill-calculator",
    headquarters: { city: "Peshawar", region: "Khyber Pakhtunkhwa" },
    officialWebsite: { url: "https://tesco.gov.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
  {
    id: "hazeco",
    shortName: "HAZECO",
    fullName: "Hazara Electric Supply Company",
    calculatorSlug: "hazeco-bill-calculator",
    // Name and city as addressed in NEPRA decisions (e.g. FCA July 2026, 04-09-2026).
    headquarters: { city: "Abbottabad", region: "Khyber Pakhtunkhwa" },
    officialWebsite: null,
  },
  {
    id: "ke",
    shortName: "K-Electric",
    fullName: "K-Electric",
    calculatorSlug: "ke-bill-calculator",
    headquarters: { city: "Karachi", region: "Sindh" },
    officialWebsite: { url: "https://ke.com.pk/", verifiedOn: WEBSITES_VERIFIED_ON },
  },
];

const providersById = new Map(providers.map((p) => [p.id, p]));
const providersBySlug = new Map(providers.map((p) => [p.calculatorSlug, p]));

export function getProvider(id: ProviderId): Provider {
  const provider = providersById.get(id);
  if (!provider) throw new Error(`Unknown provider id: ${id}`);
  return provider;
}

export function findProviderBySlug(slug: string): Provider | undefined {
  return providersBySlug.get(slug);
}

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}

export function providerCalculatorPath(provider: Provider): string {
  return `/${provider.calculatorSlug}`;
}

/** e.g. "LESCO — Lahore Electric Supply Company", or just "K-Electric". */
export function providerLabel(provider: Provider): string {
  return provider.shortName === provider.fullName
    ? provider.fullName
    : `${provider.shortName} — ${provider.fullName}`;
}
