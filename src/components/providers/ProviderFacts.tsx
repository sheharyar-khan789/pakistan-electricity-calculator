import type { ReactNode } from "react";
import type { Provider } from "@/data/providers";
import { displayUrl, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { ExternalLinkIcon } from "@/components/icons";

/** Verified identity facts about a provider, plus optional page-specific rows. */
export function ProviderFacts({
  provider,
  headingId,
  rows = [],
}: {
  provider: Provider;
  headingId: string;
  rows?: readonly { label: string; value: ReactNode }[];
}) {
  const row = "grid grid-cols-[8.5rem_1fr] gap-3 py-3 first:pt-0 last:pb-0";
  return (
    <Card as="section" aria-labelledby={headingId} padding="lg">
      <h2 id={headingId} className="text-xl font-semibold tracking-tight text-ink-950">
        About {provider.shortName}
      </h2>
      <dl className="mt-5 divide-y divide-line text-sm">
        <div className={row}>
          <dt className="text-ink-500">Full name</dt>
          <dd className="font-medium text-ink-900">{provider.fullName}</dd>
        </div>
        <div className={row}>
          <dt className="text-ink-500">Headquarters</dt>
          <dd className="font-medium text-ink-900">
            {provider.headquarters.city}, {provider.headquarters.region}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-ink-500">Official website</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {provider.officialWebsite ? (
              <a
                href={provider.officialWebsite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-brand-700 underline-offset-2 hover:underline"
              >
                {displayUrl(provider.officialWebsite.url)}
                <ExternalLinkIcon className="size-3.5 shrink-0" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <span className="font-normal text-ink-500">Not yet verified</span>
            )}
          </dd>
        </div>
        {rows.map((r) => (
          <div key={r.label} className={row}>
            <dt className="text-ink-500">{r.label}</dt>
            <dd className="min-w-0 font-medium text-ink-900">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink-500">
        This website is independent and not affiliated with {provider.shortName}. For your official bill,
        complaints or new connections, contact {provider.shortName} directly.
        {provider.officialWebsite ? ` Website link checked on ${formatDate(provider.officialWebsite.verifiedOn)}.` : null}
      </p>
    </Card>
  );
}
