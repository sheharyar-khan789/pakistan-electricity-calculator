import Link from "next/link";
import { getProvider, type ProviderId } from "@/data/providers";
import { host } from "@/lib/bill-check/content";
import { billCheckPath, listBillCheckProviders } from "@/lib/bill-check/registry";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon } from "@/components/icons";

/** Cards linking to every provider's bill-check page, built from verified config. */
export function BillCheckProviderGrid({ headingLevel = "h3", className }: { headingLevel?: "h2" | "h3"; className?: string }) {
  const Heading = headingLevel;
  return (
    <ul className={cx("grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {listBillCheckProviders().map(({ providerId, config }) => {
        const provider = getProvider(providerId);
        const supported = config?.status === "supported";
        const body = (
          <>
            <div className="flex items-start justify-between gap-3">
              <Heading className="text-lg font-semibold tracking-tight text-ink-950">{provider.shortName}</Heading>
              {supported ? <ArrowRightIcon className="mt-1 size-4 shrink-0 text-ink-400 group-hover:text-brand-700" /> : null}
            </div>
            <p className="mt-1 text-sm leading-snug text-ink-600">
              {provider.fullName !== provider.shortName ? provider.fullName : "Karachi electricity utility"}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
              {supported && config ? (
                config.identifiers.map((r) => (
                  <Badge key={r.type} tone="neutral">
                    {r.label} · {r.digits}
                  </Badge>
                ))
              ) : (
                <Badge tone="warning">Verification in progress</Badge>
              )}
            </div>
          </>
        );
        return (
          <li key={providerId}>
            {supported && config ? (
              <Link
                href={billCheckPath(config)}
                aria-label={`${provider.shortName} bill check`}
                className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[var(--shadow-raised)] sm:p-5"
              >
                {body}
              </Link>
            ) : (
              <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 p-4 sm:p-5">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Compact links to other providers' bill-check pages (internal linking). */
export function OtherBillChecks({ excludeId }: { excludeId?: ProviderId }) {
  const items = listBillCheckProviders().filter((p) => p.providerId !== excludeId && p.config?.status === "supported");
  return (
    <section aria-labelledby="other-bill-checks-heading">
      <h2 id="other-bill-checks-heading" className="text-xl font-semibold tracking-tight text-ink-950">
        {excludeId ? "Check another provider’s bill" : "Check your bill by provider"}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map(({ providerId, config }) =>
          config ? (
            <li key={providerId}>
              <Link
                href={billCheckPath(config)}
                className="inline-flex min-h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-800"
              >
                {getProvider(providerId).shortName} bill check
              </Link>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}

/** Identifier rules per provider, as verified on the official pages. */
export function IdentifierTable() {
  const rows = listBillCheckProviders().filter((p) => p.config);
  const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 sm:px-4";
  const td = "px-3 py-2.5 sm:px-4";
  return (
    <div className="relative overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">Identifiers accepted by each official bill page</caption>
        <thead className="border-b border-line bg-ink-50">
          <tr>
            <th scope="col" className={th}>Provider</th>
            <th scope="col" className={th}>Search by</th>
            <th scope="col" className={th}>Official page</th>
            <th scope="col" className={th}>Checked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ providerId, config }) =>
            config ? (
              <tr key={providerId}>
                <th scope="row" className={`${td} font-semibold`}>
                  <Link href={billCheckPath(config)} className="text-brand-700 underline-offset-2 hover:underline">
                    {getProvider(providerId).shortName}
                  </Link>
                </th>
                <td className={`${td} text-ink-700`}>
                  {config.identifiers
                    .map((r) => `${r.label}: ${r.digits} digits${r.suffixes ? ` + ${r.suffixes.join("/")}` : ""}`)
                    .join("; ")}
                </td>
                <td className={`${td} text-ink-700`}>{host(config)}</td>
                <td className={`${td} whitespace-nowrap text-ink-500`}>{formatDate(config.verification.verifiedOn)}</td>
              </tr>
            ) : null,
          )}
        </tbody>
      </table>
    </div>
  );
}
