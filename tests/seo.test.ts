import { describe, it } from "node:test";
import { each, expect } from "./support/expect";
import { normalizeSiteUrl, resolveSiteSettings } from "@/config/site";
import { getProvider } from "@/data/providers";
import { billCheckDescription, billCheckTitle, getBillCheckFaq } from "@/lib/bill-check/content";
import { billCheckProviders } from "@/lib/bill-check/providers";
import { absoluteUrl } from "@/lib/seo/metadata";
import { buildRobots } from "@/lib/seo/robots";
import { breadcrumbListSchema, faqPageSchema } from "@/lib/seo/schema";

const PROD = "https://electricity.example";

describe("site URL and indexing switch", () => {
  it("defaults to a local dev URL with indexing off", () => {
    const s = resolveSiteSettings({});
    expect(s.url).toBe("http://localhost:3000");
    expect(s.indexingEnabled).toBe(false);
    expect(s.googleSiteVerification).toBeNull();
  });

  it("normalises the site URL to a bare origin", () => {
    expect(normalizeSiteUrl("https://electricity.example/")).toBe(PROD);
    expect(normalizeSiteUrl("https://electricity.example/some/path?x=1#y")).toBe(PROD);
    expect(normalizeSiteUrl("  https://Electricity.Example  ")).toBe(PROD);
    expect(normalizeSiteUrl("not a url")).toBeNull();
    expect(normalizeSiteUrl("ftp://electricity.example")).toBeNull();
  });

  it("enables indexing only for a public https production origin", () => {
    const s = resolveSiteSettings({ NEXT_PUBLIC_SITE_URL: PROD, NEXT_PUBLIC_ENABLE_INDEXING: "true" });
    expect(s.indexingEnabled).toBe(true);
    expect(s.url).toBe(PROD);
  });

  each<[string, string | undefined]>([
    ["missing URL", undefined],
    ["localhost", "http://localhost:3000"],
    ["plain http", "http://electricity.example"],
    ["Vercel deployment URL", "https://my-app-git-main.vercel.app"],
    ["127.0.0.1", "https://127.0.0.1"],
  ])("refuses to enable indexing with %s (build fails loudly)", (_name, url) => {
    expect(() => resolveSiteSettings({ NEXT_PUBLIC_SITE_URL: url, NEXT_PUBLIC_ENABLE_INDEXING: "true" })).toThrow();
  });

  it("never indexes a Vercel preview, even with the flag set", () => {
    const s = resolveSiteSettings({
      NEXT_PUBLIC_SITE_URL: "https://my-app-git-feature.vercel.app",
      NEXT_PUBLIC_ENABLE_INDEXING: "true",
      VERCEL_ENV: "preview",
    });
    expect(s.indexingEnabled).toBe(false);
  });

  it("only the exact string 'true' enables indexing", () => {
    for (const v of ["1", "TRUE", "yes", ""]) {
      expect(resolveSiteSettings({ NEXT_PUBLIC_SITE_URL: PROD, NEXT_PUBLIC_ENABLE_INDEXING: v }).indexingEnabled).toBe(false);
    }
  });

  it("accepts a Search Console token and rejects a pasted meta tag", () => {
    const ok = resolveSiteSettings({ NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: "abcDEF123_-xyz789" });
    expect(ok.googleSiteVerification).toBe("abcDEF123_-xyz789");
    expect(() =>
      resolveSiteSettings({ NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: '<meta name="google-site-verification" content="x">' }),
    ).toThrow();
  });
});

describe("absolute URLs", () => {
  it("homepage is the bare origin; other paths have no trailing slash", () => {
    expect(absoluteUrl("/", PROD)).toBe(PROD);
    expect(absoluteUrl("/iesco-bill-check", PROD)).toBe(`${PROD}/iesco-bill-check`);
    expect(absoluteUrl("/guides/", PROD)).toBe(`${PROD}/guides`);
  });

  it("rejects query strings, fragments and relative paths", () => {
    expect(() => absoluteUrl("/x?ref=1", PROD)).toThrow();
    expect(() => absoluteUrl("/x#a", PROD)).toThrow();
    expect(() => absoluteUrl("x", PROD)).toThrow();
  });
});

describe("robots.txt", () => {
  it("pre-launch: disallows everything and advertises no sitemap", () => {
    expect(buildRobots({ indexingEnabled: false, origin: PROD })).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("launch: allows everything (incl. CSS/JS) and advertises the sitemap", () => {
    expect(buildRobots({ indexingEnabled: true, origin: PROD })).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${PROD}/sitemap.xml`,
    });
  });
});

describe("provider bill-check metadata", () => {
  const titles = billCheckProviders.map(billCheckTitle);
  const descriptions = billCheckProviders.map(billCheckDescription);

  it("titles are unique, provider-specific and short enough for results", () => {
    expect(new Set(titles).size).toBe(titles.length);
    billCheckProviders.forEach((c, i) => {
      expect(titles[i].startsWith(`${getProvider(c.providerId).shortName} Bill Check Online`)).toBe(true);
      expect(titles[i].length).toBeLessThan(61);
    });
    expect(billCheckTitle(billCheckProviders.find((c) => c.providerId === "iesco")!)).toBe(
      "IESCO Bill Check Online: Reference Number & Customer ID",
    );
    expect(billCheckTitle(billCheckProviders.find((c) => c.providerId === "ke")!)).toBe(
      "K-Electric Bill Check Online: Account Number",
    );
  });

  it("descriptions are unique, accurate and within ~160 characters", () => {
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const d of descriptions) {
      expect(d.length).toBeLessThan(171);
      expect(/\b(official bill page)\b/.test(d)).toBe(true);
      expect(/guarantee|100%|best website|instant official/i.test(d)).toBe(false);
    }
    expect(billCheckDescription(billCheckProviders.find((c) => c.providerId === "lesco")!)).toContain("11-digit Customer ID");
  });
});

describe("structured data", () => {
  it("breadcrumbs use absolute URLs in order", () => {
    const data = breadcrumbListSchema([
      { name: "Home", path: "/" },
      { name: "Bill Check", path: "/electricity-bill-check" },
    ]) as unknown as { itemListElement: { position: number; item: string }[] };
    expect(data.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    for (const i of data.itemListElement) expect(/^https?:\/\//.test(i.item)).toBe(true);
  });

  it("FAQPage mirrors the visible FAQ exactly and contains no forbidden types", () => {
    for (const c of billCheckProviders) {
      const faq = getBillCheckFaq(c);
      const schema = faqPageSchema(faq) as unknown as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
      expect(schema.mainEntity.map((q) => q.name)).toEqual(faq.map((f) => f.question));
      expect(schema.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(faq.map((f) => f.answer));
      const json = JSON.stringify(schema);
      expect(/AggregateRating|"Review"|ratingValue/.test(json)).toBe(false);
      expect(JSON.parse(json)).toEqual(schema);
    }
  });

  it("provider FAQs say where the checker goes and that we are not the provider", () => {
    const faq = getBillCheckFaq(billCheckProviders.find((c) => c.providerId === "mepco")!);
    expect(faq.some((f) => f.answer.includes("bill.pitc.com.pk/mepcobill"))).toBe(true);
    expect(faq.some((f) => f.question === "Is this website MEPCO?" && f.answer.startsWith("No."))).toBe(true);
  });
});
