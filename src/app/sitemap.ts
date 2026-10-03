import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { providerCalculatorStatus } from "@/data/calculators";
import { guides } from "@/data/guides";
import { providerCalculatorPath, providers } from "@/data/providers";
import { billCheckPath, listBillCheckProviders } from "@/lib/bill-check/registry";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * Lists only pages meant to be indexed: supported bill-check pages, live
 * provider calculators, energy tools and published guides. `lastModified` is omitted
 * rather than guessed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: string[] = [
    routes.home,
    routes.billCheck,
    routes.electricityBillCalculator,
    routes.touCalculator,
    routes.unitCalculator,
    routes.applianceCalculator,
    routes.acCalculator,
    routes.calculators,
    routes.providers,
    routes.about,
    routes.methodology,
    routes.sources,
    routes.contact,
    routes.disclaimer,
    routes.privacyPolicy,
    routes.terms,
  ];

  const billCheckPaths = listBillCheckProviders()
    .flatMap(({ config }) => (config?.status === "supported" ? [billCheckPath(config)] : []));

  const calculatorPaths = providers
    .filter((provider) => providerCalculatorStatus(provider.id) === "available")
    .map(providerCalculatorPath);

  const guidePaths = guides.length > 0 ? [routes.guides, ...guides.map((g) => `${routes.guides}/${g.slug}`)] : [];

  const unique = [...new Set([...staticPaths, ...billCheckPaths, ...calculatorPaths, ...guidePaths])];
  return unique.map((path) => ({ url: absoluteUrl(path) }));
}
