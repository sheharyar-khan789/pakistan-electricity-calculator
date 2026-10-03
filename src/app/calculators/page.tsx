import Link from "next/link";
import { routes } from "@/config/routes";
import { getMainCalculator, getProviderCalculators } from "@/data/calculators";
import { buildMetadata } from "@/lib/seo/metadata";
import { CalculatorStatusBadge } from "@/components/calculator/CalculatorStatusBadge";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ToolGrid } from "@/components/tools/ToolPageSections";
import { ArrowRightIcon, CalculatorIcon } from "@/components/icons";

export const metadata = buildMetadata({
  title: "Electricity Calculators",
  description:
    "Electricity calculators for Pakistan: bill calculator, provider bill calculators, and unit, appliance and AC cost calculators.",
  path: routes.calculators,
});

export default function CalculatorsPage() {
  const main = getMainCalculator();
  const providerCalculators = getProviderCalculators();

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Electricity Calculators", path: routes.calculators },
        ]}
        title="Electricity Calculators"
        lead="Calculators for estimating electricity bills, units and appliance costs in Pakistan. Estimates are for planning; your official bill is the amount to pay."
      />

      <Container className="space-y-12 py-8 sm:py-12">
        <section aria-labelledby="main-calculator-heading">
          <Link
            href={main.href}
            className="group flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[var(--shadow-raised)] sm:flex-row sm:items-center sm:p-7"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ink-950 text-2xl text-volt-400">
              <CalculatorIcon />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="main-calculator-heading" className="text-xl font-semibold tracking-tight text-ink-950">
                  {main.title}
                </h2>
                <CalculatorStatusBadge status={main.status} />
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600 sm:text-base">{main.description}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              Open calculator
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </section>

        <section aria-labelledby="provider-calculators-heading">
          <h2 id="provider-calculators-heading" className="text-2xl font-semibold tracking-tight text-ink-950">
            Provider calculators
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            Calculators set up for a single electricity provider, with that provider already selected.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providerCalculators.map((calculator) => (
              <li key={calculator.id}>
                <Link
                  href={calculator.href}
                  className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[var(--shadow-raised)]"
                >
                  <h3 className="text-base font-semibold text-ink-950">{calculator.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">{calculator.description}</p>
                  <div className="mt-auto pt-4">
                    <CalculatorStatusBadge status={calculator.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="energy-tools-heading">
          <h2 id="energy-tools-heading" className="text-2xl font-semibold tracking-tight text-ink-950">
            Energy and appliance tools
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            Work out units from meter readings, or what an appliance or AC uses. These tools use standard formulas and
            your own figures.
          </p>
          <div className="mt-6">
            <ToolGrid exclude="bill-calculator" from="calculators" />
          </div>
        </section>
      </Container>
    </>
  );
}
