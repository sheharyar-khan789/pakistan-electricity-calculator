import Link from "next/link";
import { routes } from "@/config/routes";
import { providerCalculatorPath, providers, type ProviderId } from "@/data/providers";
import { CHARGE_GROUP_LABELS } from "./ResultBreakdown";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { SourceBlock } from "@/components/ui/SourceBlock";

/** Shown above a calculator whose engine is not connected yet. */
export function EngineStatusNotice({ providerName }: { providerName?: string }) {
  return (
    <Alert tone="info" title="Estimates are not switched on yet">
      <p>
        {providerName
          ? `We are verifying ${providerName} tariff data against official sources.`
          : "We are verifying tariff data for each provider against official sources."}{" "}
        Until that is complete, the calculator will not show figures. You can still use it to work
        out your units from meter readings. See the <Link href={routes.methodology}>methodology</Link>{" "}
        for how estimates will be produced.
      </p>
    </Alert>
  );
}

const RESULT_PARTS = [
  {
    label: CHARGE_GROUP_LABELS.energy,
    text: "The cost of the units you used, worked out with the tariff rates or slabs that apply to your consumer type.",
  },
  {
    label: CHARGE_GROUP_LABELS.fixed,
    text: "Charges that do not depend on units, where your tariff includes them.",
  },
  {
    label: CHARGE_GROUP_LABELS.adjustment,
    text: "Adjustments notified for the billing period, such as fuel price adjustments.",
  },
  {
    label: CHARGE_GROUP_LABELS.tax,
    text: "Government taxes and duties added to the bill.",
  },
  {
    label: "Effective cost per unit",
    text: "The estimated total divided by your units, so you can compare months.",
  },
] as const;

/** Explains each part of the result panel. Static, no tariff values. */
export function ResultExplainer() {
  return (
    <Card as="section" aria-labelledby="explainer-heading" padding="lg">
      <h2 id="explainer-heading" className="text-xl font-semibold tracking-tight text-ink-950">
        What your estimate includes
      </h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {RESULT_PARTS.map((part) => (
          <div key={part.label}>
            <dt className="text-sm font-semibold text-ink-900">{part.label}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink-600">{part.text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 border-t border-line pt-5 text-sm leading-relaxed text-ink-600">
        Estimates do not include arrears, late payment surcharges, instalments or billing corrections
        that may appear on your actual bill.
      </p>
    </Card>
  );
}

export function FindUnitsTip() {
  return (
    <Card as="section" aria-labelledby="units-tip-heading" padding="lg">
      <h2 id="units-tip-heading" className="text-xl font-semibold tracking-tight text-ink-950">
        Where to find your units
      </h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-600 marker:text-ink-400">
        <li>Your electricity bill lists the units consumed for the billing month.</li>
        <li>
          If you don’t have a bill, note the reading on your meter today and compare it with the
          reading printed on your last bill. Use the <strong className="font-semibold text-ink-800">Use meter readings</strong> option in the calculator.
        </li>
        <li>Enter whole units only. The calculator does not need your reference or account number.</li>
      </ul>
    </Card>
  );
}

export function ProviderLinks({ excludeId, headingId }: { excludeId?: ProviderId; headingId: string }) {
  const list = providers.filter((provider) => provider.id !== excludeId);
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-xl font-semibold tracking-tight text-ink-950">
        {excludeId ? "Other provider calculators" : "Provider calculators"}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {list.map((provider) => (
          <li key={provider.id}>
            <Link
              href={providerCalculatorPath(provider)}
              className="inline-flex min-h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              {provider.shortName} bill calculator
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TariffSourcesPending() {
  return (
    <SourceBlock
      title="Tariff source and version"
      sources={[]}
      emptyMessage="When estimates are switched on, every result will show the tariff version used, links to its official source documents and the date the data was last verified."
    />
  );
}
