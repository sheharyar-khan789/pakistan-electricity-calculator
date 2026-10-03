import Link from "next/link";
import { routes } from "@/config/routes";
import { getBillCheckHubFaq } from "@/data/bill-check-faq";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqPageSchema } from "@/lib/seo/schema";
import { BillChecker } from "@/components/bill-check/BillChecker";
import { BillCheckProviderGrid, IdentifierTable } from "@/components/bill-check/BillCheckSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { Card } from "@/components/ui/Card";
import { FaqList } from "@/components/ui/FaqList";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon } from "@/components/icons";

export const metadata = buildMetadata({
  title: "Electricity Bill Check Online for All Providers",
  description:
    "Check your electricity bill online in Pakistan. Choose LESCO, IESCO, MEPCO, FESCO, GEPCO, PESCO, HESCO, SEPCO, QESCO, TESCO, HAZECO or K-Electric and open the official bill page.",
  path: routes.billCheck,
});

const STEPS = [
  { title: "Choose your provider", text: "Pick the company named on your electricity bill." },
  { title: "Enter your number", text: "Type your reference number, Customer ID or K-Electric account number. We check the format." },
  { title: "Open the official page", text: "We copy your number and open your provider’s official bill page, where you see your bill." },
] as const;

export default function BillCheckPage() {
  const faq = getBillCheckHubFaq();
  return (
    <>
      <JsonLd data={faqPageSchema(faq)} />
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Bill Check", path: routes.billCheck },
        ]}
        title="Electricity Bill Check Online"
        lead="See your current electricity bill from any Pakistani provider. Enter the number from your bill and we’ll take you to your provider’s official bill page."
      />

      <Container className="space-y-12 py-8 sm:py-12">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-raised)] sm:p-7">
            <h2 className="mb-5 text-base font-semibold text-ink-950">Check your bill</h2>
            <BillChecker />
          </div>
          <Card as="section" aria-labelledby="how-heading" padding="lg">
            <h2 id="how-heading" className="text-xl font-semibold tracking-tight text-ink-950">
              How it works
            </h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800 ring-1 ring-brand-200">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{s.title}</p>
                    <p className="text-sm leading-relaxed text-ink-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink-500">
              This is an independent website. Your number stays in your browser and your bill is shown only on the
              official page.
            </p>
          </Card>
        </div>

        <section aria-labelledby="providers-heading">
          <h2 id="providers-heading" className="text-2xl font-semibold tracking-tight text-ink-950">
            Bill check by provider
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">Each page explains the numbers that provider accepts and links to its official bill page.</p>
          <BillCheckProviderGrid className="mt-6" />
        </section>

        <section aria-labelledby="identifiers-heading">
          <h2 id="identifiers-heading" className="text-2xl font-semibold tracking-tight text-ink-950">
            Which number to use
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            As shown on each official bill page. Not sure where to find yours? Read the{" "}
            <Link href={routes.referenceNumberGuide} className="font-medium text-brand-700 underline underline-offset-2">
              reference number guide
            </Link>
            .
          </p>
          <div className="mt-6">
            <IdentifierTable />
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
          <div>
            <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight text-ink-950">
              Bill check questions
            </h2>
            <p className="mt-3 text-ink-600">
              Want to estimate a bill from units instead?{" "}
              <Link href={routes.electricityBillCalculator} className="inline-flex items-center gap-1 font-medium text-brand-700 underline underline-offset-2">
                Use the bill calculator <ArrowRightIcon className="size-3.5" />
              </Link>
            </p>
          </div>
          <FaqList items={faq} />
        </section>
      </Container>
    </>
  );
}
