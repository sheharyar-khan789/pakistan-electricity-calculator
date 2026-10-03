/**
 * Site-wide configuration.
 *
 * Deployment-specific values (domain, indexing, verification, contact) come
 * from environment variables so nothing environment-specific is hard-coded.
 * See `.env.example` and docs/SEO-LAUNCH.md.
 */

/**
 * Production origin. Used whenever NEXT_PUBLIC_SITE_URL is unset, invalid or
 * a local address, so no build ever publishes localhost URLs.
 */
export const PRODUCTION_URL = "https://pakistan-electricity-calculator.vercel.app";
const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$|\.local(host)?$/i;
/** Google Search Console HTML-tag tokens are URL-safe base64-like strings. */
const VERIFICATION_TOKEN = /^[A-Za-z0-9_-]{10,100}$/;
/** A plain mailbox address: no spaces, no "mailto:", one "@", a dotted domain. */
const EMAIL = /^[^\s@<>()"',;:]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

type Env = Partial<Record<string, string | undefined>>;

export type ResolvedSiteSettings = {
  url: string;
  indexingEnabled: boolean;
  googleSiteVerification: string | null;
  contactEmail: string | null;
};

function readOptional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Normalises NEXT_PUBLIC_SITE_URL to a bare origin ("https://example.com"):
 * no path, query, hash or trailing slash, so every canonical, sitemap and
 * structured-data URL is built from one consistent base.
 */
export function normalizeSiteUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalUrl(origin: string): boolean {
  return LOCAL_HOSTS.test(new URL(origin).hostname);
}

/** Public https origin: not local, and not a *.vercel.app address other than the production one. */
export function isProductionSafeUrl(origin: string): boolean {
  if (origin === PRODUCTION_URL) return true;
  const url = new URL(origin);
  return url.protocol === "https:" && !LOCAL_HOSTS.test(url.hostname) && !url.hostname.endsWith(".vercel.app");
}

/** The site origin: NEXT_PUBLIC_SITE_URL when it is a valid non-local URL, else PRODUCTION_URL. */
export function resolveSiteUrl(raw: string | undefined): string {
  const url = normalizeSiteUrl(raw);
  return url && !isLocalUrl(url) ? url : PRODUCTION_URL;
}

/**
 * Resolves deployment settings. Indexing is enabled only when ALL hold:
 * - NEXT_PUBLIC_ENABLE_INDEXING is exactly "true";
 * - this is not a Vercel preview deployment;
 * - the resolved site URL is a public https origin (PRODUCTION_URL or a custom domain).
 *
 * Asking for indexing with an unsafe URL throws, so a misconfigured launch
 * fails the build instead of publishing localhost or preview canonicals.
 */
export function resolveSiteSettings(env: Env): ResolvedSiteSettings {
  const url = resolveSiteUrl(env.NEXT_PUBLIC_SITE_URL);
  const wantsIndexing = env.NEXT_PUBLIC_ENABLE_INDEXING === "true";
  const isPreview = env.VERCEL_ENV === "preview";

  if (wantsIndexing && !isPreview && !isProductionSafeUrl(url)) {
    throw new Error(
      `NEXT_PUBLIC_ENABLE_INDEXING=true requires NEXT_PUBLIC_SITE_URL to be the public https production origin (got "${env.NEXT_PUBLIC_SITE_URL ?? ""}").`,
    );
  }

  const token = readOptional(env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION);
  if (token && !VERIFICATION_TOKEN.test(token)) {
    throw new Error("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION must be only the content value of Google's meta tag.");
  }

  const contactEmail = readOptional(env.NEXT_PUBLIC_CONTACT_EMAIL);
  if (contactEmail && !EMAIL.test(contactEmail)) {
    throw new Error('NEXT_PUBLIC_CONTACT_EMAIL must be a plain email address such as "name@example.com" (no "mailto:").');
  }

  return {
    url,
    indexingEnabled: wantsIndexing && !isPreview,
    googleSiteVerification: token,
    contactEmail,
  };
}

export type LaunchReadiness = {
  /** What kind of build this configuration produces. */
  mode: "production" | "preview" | "pre-launch";
  /** Must be fixed before a public, indexed launch. */
  blockers: string[];
  /** Owner actions that are recommended but do not stop indexing. */
  warnings: string[];
};

/**
 * Launch checklist for a set of environment values, without throwing.
 * Reports owner-only values that are missing; never invents them.
 */
export function checkLaunchReadiness(env: Env): LaunchReadiness {
  let settings: ResolvedSiteSettings;
  try {
    settings = resolveSiteSettings(env);
  } catch (error) {
    return { mode: "pre-launch", blockers: [(error as Error).message], warnings: [] };
  }
  const mode = env.VERCEL_ENV === "preview" ? "preview" : settings.indexingEnabled ? "production" : "pre-launch";
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (mode !== "preview") {
    if (!isProductionSafeUrl(settings.url)) blockers.push("NEXT_PUBLIC_SITE_URL is not set to the public https production origin.");
    if (!settings.indexingEnabled) blockers.push('NEXT_PUBLIC_ENABLE_INDEXING is not "true", so every page is noindex and robots.txt blocks crawling.');
    if (!settings.contactEmail) blockers.push("NEXT_PUBLIC_CONTACT_EMAIL is not set, so /contact has no way to reach you.");
    if (!settings.googleSiteVerification) {
      warnings.push("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION is not set. That is fine if Search Console is verified with a DNS TXT record.");
    }
  }
  return { mode, blockers, warnings };
}

// Each variable is read explicitly so Next.js can inline NEXT_PUBLIC_* values.
const settings = resolveSiteSettings({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ENABLE_INDEXING: process.env.NEXT_PUBLIC_ENABLE_INDEXING,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

export const siteConfig = {
  name: "Pakistan Electricity & Utility Calculator",
  shortName: "PK Utility Calculator",
  description:
    "Check your electricity bill online in Pakistan through your provider’s official bill page, and estimate bills from units with official tariff rates. Independent and free.",
  url: settings.url,
  locale: "en_PK",
  language: "en",
  /** Search-engine indexing; OFF unless explicitly and safely enabled (see above). */
  indexingEnabled: settings.indexingEnabled,
  /** Google Search Console HTML-tag verification value, if configured. */
  googleSiteVerification: settings.googleSiteVerification,
  /** Public contact address. Leave unset until a real inbox exists. */
  contactEmail: settings.contactEmail,
} as const;

export type SiteConfig = typeof siteConfig;
