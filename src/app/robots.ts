import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { buildRobots } from "@/lib/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobots({ indexingEnabled: siteConfig.indexingEnabled, origin: siteConfig.url });
}
