import { siteConfig } from "@/config/site";
import { absoluteUrl } from "./metadata";

/**
 * Structured-data builders. Each one only describes content that is visible
 * on the page that renders it.
 */

export type BreadcrumbItem = { name: string; path: string };

type JsonLdObject = { "@context": "https://schema.org"; "@type": string } & Record<string, unknown>;

export function breadcrumbListSchema(items: readonly BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webSiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    inLanguage: siteConfig.language,
  };
}

/**
 * Only render this on a page whose calculator actually works (i.e. has a
 * connected engine). Describing a non-functional app would be misleading.
 */
export function webApplicationSchema(input: {
  name: string;
  description: string;
  path: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser.",
    isAccessibleForFree: true,
    inLanguage: siteConfig.language,
  };
}

export type FaqEntry = { question: string; answer: string };

/** Only for FAQ content rendered visibly, word for word, on the same page. */
export function faqPageSchema(entries: readonly FaqEntry[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}
