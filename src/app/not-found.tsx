import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { providerCalculatorPath, providers } from "@/data/providers";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Error 404</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          This page doesn’t exist
        </h1>
        <p className="mt-4 text-pretty text-ink-600">
          The link may be broken or the page may have moved. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
          <ButtonLink href={routes.electricityBillCalculator}>Electricity Bill Calculator</ButtonLink>
          <ButtonLink href={routes.home} variant="secondary">
            Go to homepage
          </ButtonLink>
        </div>
        <nav aria-label="Provider calculators" className="mt-10 border-t border-line pt-8">
          <p className="text-sm font-semibold text-ink-900">Provider calculators</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {providers.map((provider) => (
              <li key={provider.id}>
                <Link
                  href={providerCalculatorPath(provider)}
                  className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-700 hover:border-brand-300 hover:text-brand-800"
                >
                  {provider.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Container>
  );
}
