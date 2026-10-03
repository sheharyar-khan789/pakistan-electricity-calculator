import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProviderBySlug, providers } from "@/data/providers";
import { billCheckProviders } from "@/lib/bill-check/providers";
import { findBillCheckBySlug } from "@/lib/bill-check/registry";
import { ProviderBillCheckView, providerBillCheckMetadata } from "@/components/providers/ProviderBillCheckView";
import { ProviderCalculatorView, providerCalculatorMetadata } from "@/components/providers/ProviderCalculatorView";

/**
 * One top-level route serves both provider page families, from config:
 *   /<provider>-bill-check       (primary: official bill lookup)
 *   /<provider>-bill-calculator  (secondary: estimate)
 * Unknown slugs 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...billCheckProviders.map((c) => ({ providerPage: c.slug })),
    ...providers.map((p) => ({ providerPage: p.calculatorSlug })),
  ];
}

type Resolved =
  | { kind: "bill-check"; config: NonNullable<ReturnType<typeof findBillCheckBySlug>> }
  | { kind: "calculator"; provider: NonNullable<ReturnType<typeof findProviderBySlug>> };

function resolve(slug: string): Resolved {
  const config = findBillCheckBySlug(slug);
  if (config) return { kind: "bill-check", config };
  const provider = findProviderBySlug(slug);
  if (provider) return { kind: "calculator", provider };
  notFound();
}

export async function generateMetadata(props: PageProps<"/[providerPage]">): Promise<Metadata> {
  const page = resolve((await props.params).providerPage);
  return page.kind === "bill-check" ? providerBillCheckMetadata(page.config) : providerCalculatorMetadata(page.provider);
}

export default async function ProviderPage(props: PageProps<"/[providerPage]">) {
  const page = resolve((await props.params).providerPage);
  return page.kind === "bill-check" ? (
    <ProviderBillCheckView config={page.config} />
  ) : (
    <ProviderCalculatorView provider={page.provider} />
  );
}
