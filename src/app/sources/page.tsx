import type { ReactNode } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { officialSources } from "@/data/official-sources";
import { getProvider, providerCalculatorPath, providers } from "@/data/providers";
import { displayDestination } from "@/lib/bill-check/content";
import { billCheckPath, listBillCheckProviders } from "@/lib/bill-check/registry";
import { displayUrl, formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatBillingMonth } from "@/lib/calculator/billing-month";
import {
  adjustmentsLastVerifiedOn,
  coveredProviders,
  getSourceUsage,
  type SourceUsage,
} from "@/lib/tariffs/overview";
import { ProsePage } from "@/components/ui/ProsePage";
import { EmptyState } from "@/components/ui/States";
import { DocumentIcon, ExternalLinkIcon } from "@/components/icons";

export const metadata = buildMetadata({
  title: "Sources",
  description:
    "The official bill pages the bill checker opens and the NEPRA and Government tariff documents behind our estimates, with the date each was checked.",
  path: routes.sources,
});

const USE_LABEL: Record<SourceUsage["uses"][number], string> = {
  tariff: "Tariff rates and rules",
  eligibility: "Wording of consumer definitions and time-of-use eligibility, quoted for every provider",
  "peak-hours": "Peak and off-peak hours (shown for this company only)",
  fca: "Fuel charges adjustment (FCA)",
  qta: "Quarterly tariff adjustment (QTA)",
};

function appliesTo(usage: SourceUsage, covered: readonly string[]): string {
  const names = usage.providers.map((id) => getProvider(id).shortName);
  return usage.providers.length === covered.length && covered.length > 1
    ? `All ${covered.length} supported providers`
    : names.join(", ") || "Not a tariff source for any provider";
}

/** One tariff document with its authority, dates and the providers it applies to. */
export function TariffDocument({ usage, covered }: { usage: SourceUsage; covered: readonly string[] }) {
  const doc = usage.document;
  const months = usage.billingMonths.map(formatBillingMonth);
  return (
    <li id={`source-${doc.id}`} className="mt-4! rounded-xl border border-line bg-surface p-5">
      <p className="font-semibold text-ink-900">{doc.reference}</p>
      <p className="mt-1 text-sm">
        <ExternalLink href={doc.url}>{doc.title}</ExternalLink>
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-ink-500">Issued by</dt>
        <dd>{doc.publisher}</dd>
        <dt className="text-ink-500">Published</dt>
        <dd>{formatDate(doc.publishedOn)}</dd>
        {doc.effectiveFrom ? (
          <>
            <dt className="text-ink-500">Effective from</dt>
            <dd>{formatDate(doc.effectiveFrom)}</dd>
          </>
        ) : null}
        {months.length > 0 ? (
          <>
            <dt className="text-ink-500">Bill months</dt>
            <dd>{months.join(", ")}</dd>
          </>
        ) : null}
        <dt className="text-ink-500">Applies to</dt>
        <dd data-testid="applies-to">{appliesTo(usage, covered)}</dd>
        <dt className="text-ink-500">Used for</dt>
        <dd>{usage.uses.map((u) => USE_LABEL[u]).join("; ")}</dd>
        {doc.location ? (
          <>
            <dt className="text-ink-500">Where</dt>
            <dd>{doc.location}</dd>
          </>
        ) : null}
      </dl>
    </li>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
      {children}
      <ExternalLinkIcon className="size-3.5 shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export default function SourcesPage() {
  const documents = getSourceUsage();
  const covered = coveredProviders();
  const lookups = listBillCheckProviders();
  return (
    <ProsePage
      title="Sources"
      path={routes.sources}
      lead="The official bill pages and the tariff documents this website relies on, and how each was checked."
    >
      <h2>Official bill lookup pages</h2>
      <p>
        The bill checker only ever sends you to these official pages. Each was opened and its form read on the date
        shown; no customer number was submitted.
      </p>
      <ul>
        {lookups.map(({ providerId, config }) =>
          config ? (
            <li key={providerId}>
              <Link href={billCheckPath(config)}>{getProvider(providerId).shortName}</Link>:{" "}
              <ExternalLink href={config.lookup.url}>{displayDestination(config)}</ExternalLink>
              <span className="block text-sm text-ink-500">
                {config.identifiers.map((r) => `${r.label} (${r.digits} digits)`).join(", ")}
                {config.lookup.captcha ? " · CAPTCHA on official page" : ""} · checked{" "}
                {formatDate(config.verification.verifiedOn)}
              </span>
            </li>
          ) : null,
        )}
      </ul>
      <p>
        Official forms can change without notice, so the date above shows when each page was last checked. Pages are
        re-checked with an automated tool that reads the public form without submitting anything. A page that fails is
        switched off rather than left pointing somewhere wrong. If a link stops working for you, please tell us through
        the <Link href={routes.contact}>contact page</Link>.
      </p>

      <h2>Official organisations</h2>
      <p>Tariff data is taken only from publications of these official bodies:</p>
      <ul className="list-none! pl-0!">
        {officialSources.map((source) => (
          <li key={source.url} className="mt-4! rounded-xl border border-line bg-surface p-5">
            <p className="font-semibold text-ink-900">
              {source.name}
              {source.abbreviation ? ` (${source.abbreviation})` : ""}
            </p>
            <p className="mt-1 text-sm">{source.role}</p>
            <p className="mt-2 text-sm">
              <ExternalLink href={source.url}>{displayUrl(source.url)}</ExternalLink>
              <span className="text-ink-500"> · Link checked {formatDate(source.verifiedOn)}</span>
            </p>
          </li>
        ))}
      </ul>

      <h2>Tariff documents</h2>
      {documents.length > 0 ? (
        <>
          <p>
            Every figure used by the calculators comes from these documents. Each was downloaded from
            NEPRA’s website and checked on the date shown.
          </p>
          <p>
            A document that belongs to one company, such as its own tariff notification, is listed against that
            company only.
          </p>
          <ul className="list-none! pl-0!">
            {documents.map((usage) => (
              <TariffDocument key={usage.document.id} usage={usage} covered={covered} />
            ))}
          </ul>
          <p className="text-sm text-ink-500">Last checked {formatDate(adjustmentsLastVerifiedOn)}.</p>
        </>
      ) : (
        <EmptyState
          icon={<DocumentIcon />}
          title="No tariff documents are connected"
          description="Documents appear here when verified tariff data is connected."
          className="mt-6!"
        />
      )}

      <h2>Electricity provider websites</h2>
      <p>
        For your actual bill, account information or complaints, use your provider’s official
        channels. Websites are listed only where we have confirmed the address.
      </p>
      <ul>
        {providers.map((provider) => (
          <li key={provider.id}>
            <Link href={providerCalculatorPath(provider)}>{provider.shortName}</Link>
            {provider.fullName !== provider.shortName ? ` — ${provider.fullName}` : ""}:{" "}
            {provider.officialWebsite ? (
              <ExternalLink href={provider.officialWebsite.url}>
                {displayUrl(provider.officialWebsite.url)}
              </ExternalLink>
            ) : (
              <span className="text-ink-500">website not yet verified</span>
            )}
          </li>
        ))}
      </ul>

      <h2>How sources are used</h2>
      <p>
        The <Link href={routes.methodology}>methodology</Link> explains how source documents are turned
        into versioned tariff data and how it is checked.
      </p>
    </ProsePage>
  );
}
