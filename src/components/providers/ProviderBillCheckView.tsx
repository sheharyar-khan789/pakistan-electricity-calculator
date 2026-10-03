import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { providerCalculatorStatus } from "@/data/calculators";
import { getProvider, providerCalculatorPath } from "@/data/providers";
import {
  billCheckDescription,
  billCheckTitle,
  displayDestination,
  getBillCheckFaq,
  host,
  identifierSummary,
} from "@/lib/bill-check/content";
import { billCheckPath } from "@/lib/bill-check/registry";
import type { BillCheckProvider } from "@/lib/bill-check/types";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqPageSchema } from "@/lib/seo/schema";
import { BillChecker } from "@/components/bill-check/BillChecker";
import { OtherBillChecks } from "@/components/bill-check/BillCheckSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FaqList } from "@/components/ui/FaqList";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/icons";
import { describeProvider } from "./ProviderCalculatorView";
import { ProviderFacts } from "./ProviderFacts";

export function providerBillCheckMetadata(config: BillCheckProvider): Metadata {
  return buildMetadata({
    // Provider + intent + accepted identifiers, without the brand suffix to stay short.
    title: billCheckTitle(config),
    absoluteTitle: true,
    description: billCheckDescription(config),
    path: billCheckPath(config),
    indexable: config.status === "supported",
  });
}

function SectionCard({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card as="section" aria-labelledby={id} padding="lg">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-ink-950">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700 [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </Card>
  );
}

/** /<provider>-bill-check — the primary flow for one provider. */
export function ProviderBillCheckView({ config }: { config: BillCheckProvider }) {
  const provider = getProvider(config.providerId);
  const name = provider.shortName;
  const title = `${name} Bill Check Online`;
  const path = billCheckPath(config);
  const site = host(config);
  const faq = getBillCheckFaq(config);
  const ref = config.identifiers.find((r) => r.type === "reference-number");
  const customer = config.identifiers.find((r) => r.type === "customer-id");
  const account = config.identifiers.find((r) => r.type === "account-number");
  const calculatorAvailable = providerCalculatorStatus(provider.id) === "available";

  return (
    <>
      {faq.length > 0 ? <JsonLd data={faqPageSchema(faq)} /> : null}
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Bill Check", path: routes.billCheck },
          { name: title, path },
        ]}
        title={title}
        meta={<Badge tone="brand">Official page link checked {formatDate(config.verification.verifiedOn)}</Badge>}
        lead={`See your current ${describeProvider(provider)} electricity bill. Enter your ${identifierSummary(config)}; we check it and take you to ${name}’s official bill page.`}
      />

      <Container className="space-y-8 py-8 sm:py-12">
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink-700">
          We help you open {name}’s official bill service at <strong>{displayDestination(config)}</strong>. This website is
          not {name}, does not show or store your bill, and does not keep your number.
        </p>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-raised)] sm:p-7">
            <h2 className="mb-5 text-base font-semibold text-ink-950">Check your {name} bill</h2>
            <BillChecker initialProviderId={provider.id} lockProvider />
          </div>

          <SectionCard id="after-check-heading" title={`How ${name} bill checking works`}>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>We check your number has the right format for {name}. It stays in your browser.</li>
              <li>
                You open {name}’s official bill page on <strong>{site}</strong>, run by {config.lookup.operator}, in a new tab.
                We copy your number so you can paste it.
              </li>
              <li>
                You enter the number{config.lookup.captcha ? " and the CAPTCHA code" : ""} there to see your current bill.
              </li>
            </ol>
            <p>
              The official page cannot be pre-filled from another website, so the final step always happens on {site}.
            </p>
          </SectionCard>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {ref ? (
            <SectionCard id="reference-heading" title={`How to find your ${name} reference number`}>
              <p>
                Your reference number is printed on your {name} electricity bill. {name}’s official bill page searches by{" "}
                <strong>{ref.officialLabel}</strong>: {ref.digits} digits, followed on your bill by a letter,{" "}
                {ref.suffixes?.join(" or ")}. On the official page you type the {ref.digits} digits in the box and choose the
                letter from a small list next to it.
              </p>
              <p>
                You can paste the number with spaces or dashes; the checker removes them. See the{" "}
                <Link href={routes.referenceNumberGuide}>reference number guide</Link> for more help.
              </p>
            </SectionCard>
          ) : null}
          {customer ? (
            <SectionCard id="customer-id-heading" title={`Check your ${name} bill with Customer ID`}>
              <p>
                You can also search by <strong>Customer ID</strong>. On {name}’s official page the Customer ID is{" "}
                <strong>{customer.digits} digits</strong>. Choose “Customer ID” in the checker before entering it.
              </p>
            </SectionCard>
          ) : null}
          {account ? (
            <SectionCard id="account-heading" title={`How to find your ${name} account number`}>
              <p>
                {name}’s official page searches by <strong>{account.officialLabel}</strong>, which is {account.digits} digits.{" "}
                {account.whereToFind}
              </p>
              <p>
                The page also has an optional Consumer Number field and asks for a CAPTCHA code before showing your bill.
              </p>
            </SectionCard>
          ) : null}

          <SectionCard id="download-heading" title={`Download or print a duplicate ${name} bill`}>
            <p>
              Your bill is shown on {name}’s official page. If that page offers a print or download option, use it.
              Otherwise use your browser’s print function, which can also save the page as a PDF.
            </p>
          </SectionCard>
          <SectionCard id="payment-heading" title={`How to pay your ${name} bill`}>
            <p>Pay the amount shown on your official bill by its due date, using the payment channels {name} accepts.</p>
            {config.notes.filter((n) => /pay/i.test(n)).map((n) => (
              <p key={n}>{n}</p>
            ))}
            {provider.officialWebsite ? (
              <p>
                {name}’s website:{" "}
                <a href={provider.officialWebsite.url} target="_blank" rel="noopener noreferrer">
                  {new URL(provider.officialWebsite.url).host}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            ) : null}
          </SectionCard>
        </div>

        {config.notes.filter((n) => !/pay/i.test(n)).length > 0 ? (
          <Alert tone="info" title={`Good to know about ${name}`}>
            <ul className="space-y-1">
              {config.notes.filter((n) => !/pay/i.test(n)).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <section aria-labelledby="bill-check-faq-heading" className="space-y-4">
          <h2 id="bill-check-faq-heading" className="text-xl font-semibold tracking-tight text-ink-950">
            Frequently asked questions
          </h2>
          <FaqList items={faq} />
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <SectionCard id="related-heading" title="Related tools and guides">
            <ul className="space-y-2">
              {calculatorAvailable ? (
                <li>
                  <Link href={providerCalculatorPath(provider)} className="inline-flex items-center gap-1">
                    Estimate a {name} bill from units <ArrowRightIcon className="size-3.5" />
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href={routes.referenceNumberGuide}>How to find your reference number or Customer ID</Link>
              </li>
              <li>
                <Link href={routes.billExplainedGuide}>Understand your electricity bill</Link>
              </li>
              <li>
                <Link href={routes.billCheck}>Bill check for all providers</Link>
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="source-heading" title="Official source">
            <p>{config.verification.method}</p>
            <ul className="space-y-1.5">
              {config.verification.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                    {s.label}
                    <ExternalLinkIcon className="size-3.5 shrink-0" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-500">Last verified {formatDate(config.verification.verifiedOn)}.</p>
          </SectionCard>
        </div>

        <ProviderFacts provider={provider} headingId="provider-facts-heading" />

        <OtherBillChecks excludeId={provider.id} />

        <p className="text-xs leading-relaxed text-ink-500">
          This website is independent and not affiliated with {name}, PITC or NEPRA. We do not retrieve, store or change
          bills. Your payable amount is the one shown on {name}’s official bill.
        </p>
      </Container>
    </>
  );
}
