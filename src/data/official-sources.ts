/**
 * Official organisations whose publications are used as tariff sources.
 * Each URL was opened and its page title checked on `verifiedOn`.
 * Individual tariff documents are attached to `TariffVersion.sources`
 * in Phase 2, not listed here.
 */
export type OfficialSource = {
  name: string;
  abbreviation?: string;
  role: string;
  url: string;
  verifiedOn: string;
};

export const officialSources: readonly OfficialSource[] = [
  {
    name: "National Electric Power Regulatory Authority",
    abbreviation: "NEPRA",
    role: "The regulator of Pakistan’s electricity sector. Publishes tariff determinations, decisions and related documents.",
    url: "https://nepra.org.pk/",
    verifiedOn: "2026-10-01",
  },
  {
    name: "Ministry of Energy (Power Division), Government of Pakistan",
    role: "Federal government division responsible for the power sector. Publishes policy notifications related to electricity.",
    url: "https://power.gov.pk/",
    verifiedOn: "2026-10-01",
  },
];
