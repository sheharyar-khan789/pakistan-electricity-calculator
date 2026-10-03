import Link from "next/link";
import { routes } from "@/config/routes";
import { providerCalculatorPath, providers } from "@/data/providers";
import { displayUrl } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { providerCalculatorStatus } from "@/data/calculators";
import { billCheckPath, getBillCheck } from "@/lib/bill-check/registry";
import { BillCheckProviderGrid } from "@/components/bill-check/BillCheckSections";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExternalLinkIcon } from "@/components/icons";

export const metadata = buildMetadata({
  title: "Electricity Providers in Pakistan",
  description:
    "Pakistan’s electricity companies, from LESCO, IESCO and MEPCO to HAZECO and K-Electric, with bill check links, official websites and headquarters.",
  path: routes.providers,
});

export default function ProvidersPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Providers", path: routes.providers },
        ]}
        title="Electricity Providers in Pakistan"
        lead="Your electricity bill is issued by the distribution company that serves your area. Select your provider to check your bill online."
      />

      <Container className="space-y-12 py-8 sm:py-12">
        <section aria-labelledby="provider-cards-heading">
          <h2 id="provider-cards-heading" className="sr-only">
            Provider calculators
          </h2>
          <BillCheckProviderGrid />
        </section>

        <section aria-labelledby="provider-table-heading">
          <h2 id="provider-table-heading" className="text-2xl font-semibold tracking-tight text-ink-950">
            Provider details
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            Official websites are listed only where we have confirmed the address. This website is not
            affiliated with any of these companies.
          </p>
          <div className="mt-6 relative overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-line bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Provider</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Full name</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Headquarters</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Official website</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Bill estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink-950">
                      {getBillCheck(provider.id) ? (
                        <Link
                          href={billCheckPath(getBillCheck(provider.id)!)}
                          className="text-brand-700 underline-offset-2 hover:underline"
                        >
                          {provider.shortName}
                        </Link>
                      ) : (
                        provider.shortName
                      )}
                    </th>
                    <td className="px-4 py-3 text-ink-700">{provider.fullName}</td>
                    <td className="px-4 py-3 text-ink-700">
                      {provider.headquarters.city}, {provider.headquarters.region}
                    </td>
                    <td className="px-4 py-3">
                      {provider.officialWebsite ? (
                        <a
                          href={provider.officialWebsite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-700 underline-offset-2 hover:underline"
                        >
                          {displayUrl(provider.officialWebsite.url)}
                          <ExternalLinkIcon className="size-3.5" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      ) : (
                        <span className="text-ink-500">Not yet verified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {providerCalculatorStatus(provider.id) === "available" ? (
                        <Link
                          href={providerCalculatorPath(provider)}
                          className="text-brand-700 underline-offset-2 hover:underline"
                        >
                          Calculator
                        </Link>
                      ) : (
                        <span className="text-ink-500">Not yet available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Container>
    </>
  );
}
