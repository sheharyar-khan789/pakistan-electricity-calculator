import { describe, it } from "node:test";
import { expect } from "./support/expect";
import { generateMetadata, generateStaticParams } from "@/app/[providerPage]/page";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { providerCalculatorStatus, mainCalculatorStatus } from "@/data/calculators";
import { PROVIDER_IDS, providers } from "@/data/providers";
import { billCheckProviders } from "@/lib/bill-check/providers";
import { getCategoryRequirements, getDefaultBillingMonth } from "@/lib/calculator/engine-registry";
import { UNIFORM_TARIFF_PROVIDERS } from "@/lib/tariffs/data/coverage";

function titleText(t: unknown): string {
  return typeof t === "string" ? t : t && typeof t === "object" && "absolute" in t ? String(t.absolute) : JSON.stringify(t);
}

async function metaFor(slug: string) {
  return generateMetadata({ params: Promise.resolve({ providerPage: slug }), searchParams: Promise.resolve({}) });
}

describe("routes and SEO wiring", () => {
  it("prerenders one bill-check page and one calculator page per provider, with no duplicates", () => {
    const slugs = generateStaticParams().map((p) => p.providerPage);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of providers) {
      expect(slugs).toContain(p.calculatorSlug);
      expect(slugs).toContain(`${p.id}-bill-check`);
    }
    expect(slugs).toHaveLength(providers.length * 2);
  });

  it("calculator availability follows verified tariff coverage only", () => {
    expect(mainCalculatorStatus()).toBe("available");
    for (const id of PROVIDER_IDS) {
      expect(providerCalculatorStatus(id)).toBe(UNIFORM_TARIFF_PROVIDERS.includes(id) ? "available" : "in-development");
    }
    expect(providerCalculatorStatus("hazeco")).toBe("available");
  });

  it("sitemap lists bill checks, live calculators and guides — nothing unsupported", () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain("/electricity-bill-check");
    for (const c of billCheckProviders) expect(urls).toContain(`/${c.slug}`);
    for (const id of UNIFORM_TARIFF_PROVIDERS) expect(urls).toContain(`/${id}-bill-calculator`);
    expect(urls).toContain("/hazeco-bill-calculator");
    for (const path of ["/tou-electricity-bill-calculator", "/electricity-unit-calculator", "/appliance-electricity-calculator", "/ac-electricity-cost-calculator"]) {
      expect(urls).toContain(path);
    }
    expect(urls).toContain("/guides");
    expect(urls).toContain("/guides/electricity-bill-reference-number");
    expect(urls).toContain("/guides/understand-your-electricity-bill");
  });

  it("robots never blocks bill-check, calculator or guide pages when indexing is on", () => {
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    for (const r of list) {
      const disallow = ([] as string[]).concat(r.disallow ?? []);
      // Pre-launch disallows "/" entirely (indexing off); otherwise nothing is blocked.
      expect(disallow.every((d) => d === "/")).toBe(true);
    }
  });

  it("bill-check and calculator pages have unique, provider-specific titles and canonicals", async () => {
    const titles = new Set<string>();
    const canonicals = new Set<string>();
    for (const slug of generateStaticParams().map((p) => p.providerPage)) {
      const m = await metaFor(slug);
      const title = typeof m.title === "string" ? m.title : JSON.stringify(m.title);
      const canonical = String(m.alternates?.canonical);
      expect(titles.has(title)).toBe(false);
      expect(canonicals.has(canonical)).toBe(false);
      titles.add(title);
      canonicals.add(canonical);
      expect(canonical).toBe(`/${slug}`);
      expect((m.description ?? "").length).toBeGreaterThan(80);
    }
    expect(titleText((await metaFor("lesco-bill-check")).title)).toContain("LESCO Bill Check Online");
    expect(String((await metaFor("lesco-bill-check")).description)).toContain("11-digit Customer ID");
    expect(String((await metaFor("ke-bill-check")).description)).toContain("13-digit Account Number");
  });

  it("default bill month follows the date", () => {
    expect(getDefaultBillingMonth(new Date("2026-10-01T09:00:00+05:00"))).toBe("2026-10");
    expect(getDefaultBillingMonth(new Date("2026-08-15T09:00:00+05:00"))).toBe("2026-08");
    expect(getDefaultBillingMonth(new Date("2027-05-01T09:00:00+05:00"))).toBe("2026-11");
  });

  it("calculator form requirements are declared by the engine", () => {
    const residential = getCategoryRequirements("residential");
    expect(residential?.bands.map((b) => b.id)).toEqual(["unprotected", "protected", "lifeline"]);
    expect(residential?.sanctionedLoad).toEqual({ maxKwExclusive: 5 });
    expect(getCategoryRequirements("commercial")?.bands).toHaveLength(1);
    expect(getCategoryRequirements("industrial")).toBeNull();
    expect(getCategoryRequirements("residential", "hazeco")?.bands).toHaveLength(3);
  });
});
