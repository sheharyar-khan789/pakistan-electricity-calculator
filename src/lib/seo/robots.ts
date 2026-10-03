import type { MetadataRoute } from "next";
import { absoluteUrl } from "./metadata";

/**
 * robots.txt rules. When indexing is off (pre-launch or preview), all
 * crawling is disallowed and no sitemap is advertised. When on, everything
 * public is allowed — including /_next assets needed for rendering — and
 * the sitemap is advertised. Pages that should not rank use a noindex meta
 * tag instead of a robots block, so crawlers can still see that tag.
 */
export function buildRobots(options: { indexingEnabled: boolean; origin: string }): MetadataRoute.Robots {
  if (!options.indexingEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml", options.origin),
  };
}
