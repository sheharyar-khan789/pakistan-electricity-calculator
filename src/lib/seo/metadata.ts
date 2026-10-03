import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

type PageMetadataInput = {
  /** Page title without the site-name suffix (the root layout adds it). */
  title: string;
  description: string;
  /** Path starting with "/", used for the canonical URL. */
  path: string;
  /**
   * Whether this page should be indexed once site-wide indexing is enabled.
   * Use `false` for pages that are not yet useful on their own (e.g. a
   * provider calculator before its engine exists) to avoid thin content.
   */
  indexable?: boolean;
  /** Use the title as-is, without the site-name template. */
  absoluteTitle?: boolean;
};

/**
 * Absolute URL on the configured origin. The homepage is the bare origin
 * ("https://example.com"), matching how Next.js renders the root canonical,
 * so sitemap, canonical, Open Graph and structured data never disagree.
 */
export function absoluteUrl(path: string, origin: string = siteConfig.url): string {
  if (!path.startsWith("/") || path.includes("?") || path.includes("#")) {
    throw new Error(`absoluteUrl expects a clean root-relative path, got "${path}"`);
  }
  return path === "/" ? origin : `${origin}${path.replace(/\/+$/, "")}`;
}

export function shouldIndex(indexable: boolean): boolean {
  return siteConfig.indexingEnabled && indexable;
}

function robotsFor(indexable: boolean): Metadata["robots"] {
  // Pre-launch: keep crawlers out entirely.
  if (!siteConfig.indexingEnabled) return { index: false, follow: false };
  // Live site, but this page is not ready to rank: keep its links crawlable.
  return indexable ? { index: true, follow: true } : { index: false, follow: true };
}

export function buildMetadata({
  title,
  description,
  path,
  indexable = true,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: robotsFor(indexable),
  };
}
