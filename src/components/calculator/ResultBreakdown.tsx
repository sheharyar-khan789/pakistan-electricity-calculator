import Link from "next/link";
import { routes } from "@/config/routes";
import { formatBillingMonth } from "@/lib/calculator/billing-month";
import type { CalculationResult, ChargeGroup, ChargeLine } from "@/lib/calculator/types";
import { formatDate, formatRupees, formatRupeesPrecise, formatUnits } from "@/lib/format";
import { getProvider } from "@/data/providers";
import { getConsumerCategory } from "@/data/consumer-categories";
import { Alert } from "@/components/ui/Alert";
import { SourceBlock } from "@/components/ui/SourceBlock";
import { ChevronDownIcon } from "@/components/icons";

export const CHARGE_GROUP_LABELS: Record<ChargeGroup, string> = {
  energy: "Electricity charges",
  fixed: "Fixed charges",
  adjustment: "Adjustments",
  tax: "Taxes",
  other: "Other charges",
};

const GROUP_ORDER: readonly ChargeGroup[] = ["energy", "fixed", "adjustment", "tax", "other"];

/** Sums in whole paisa so displayed subtotals never show float noise. */
function sumRupees(lines: readonly ChargeLine[]): number {
  return lines.reduce((sum, line) => sum + Math.round(line.amount * 100), 0) / 100;
}

function groupLines(lines: readonly ChargeLine[]) {
  return GROUP_ORDER.map((group) => {
    const list = lines.filter((line) => line.group === group);
    return { group, lines: list, subtotal: sumRupees(list) };
  }).filter((entry) => entry.lines.length > 0);
}

/**
 * Full presentation of a successful calculation. Only ever rendered with a
 * real `CalculationResult` produced by a connected engine.
 */
export function ResultBreakdown({ result }: { result: CalculationResult }) {
  const provider = getProvider(result.input.providerId);
  const category = getConsumerCategory(result.input.consumerCategoryId);
  const groups = groupLines(result.breakdown.lines);
  const slabs = result.breakdown.slabs ?? [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-ink-600">Estimated bill before taxes</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-ink-950 tabular-nums sm:text-5xl">
          {formatRupees(result.total)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {provider.shortName} · {category.label} ({result.bandLabel}) ·{" "}
          {formatUnits(result.input.unitsConsumed)} · {formatBillingMonth(result.input.billingMonth)} bill
        </p>
        <p className="mt-1 text-sm text-ink-600">
          Effective cost per unit:{" "}
          <strong className="font-semibold text-ink-900 tabular-nums">
            {result.effectiveCostPerUnit !== null ? formatRupeesPrecise(result.effectiveCostPerUnit) : "not applicable at 0 units"}
          </strong>
        </p>
      </div>

      <dl className="divide-y divide-line rounded-xl border border-line">
        {groups.map(({ group, lines, subtotal }) => (
          <div key={group} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm font-semibold text-ink-900">{CHARGE_GROUP_LABELS[group]}</dt>
              <dd className="text-sm font-semibold text-ink-900 tabular-nums">{formatRupeesPrecise(subtotal)}</dd>
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {lines.map((line) => (
                <li key={line.id} className="flex items-baseline justify-between gap-4 text-sm text-ink-600">
                  <span className="min-w-0">
                    {line.label !== CHARGE_GROUP_LABELS[group] ? line.label : null}
                    {line.detail ? <span className="block text-xs text-ink-500">{line.detail}</span> : null}
                  </span>
                  {lines.length > 1 ? (
                    <span className="shrink-0 tabular-nums">{formatRupeesPrecise(line.amount)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="px-4 py-3">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm font-semibold text-ink-900">{CHARGE_GROUP_LABELS.tax}</dt>
            <dd className="text-sm font-medium text-ink-500">Not included</dd>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Taxes and duties depend on your province and tax status and will be added to your actual bill.
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-4 bg-ink-50 px-4 py-3">
          <dt className="text-sm font-semibold text-ink-950">Estimated total before taxes</dt>
          <dd className="text-base font-semibold text-ink-950 tabular-nums">{formatRupeesPrecise(result.total)}</dd>
        </div>
      </dl>

      {result.pendingAdjustments.length > 0 ? (
        <Alert tone="info" title="Not yet notified">
          <ul className="space-y-1">
            {result.pendingAdjustments.map((p) => (
              <li key={p.kind}>{p.message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {slabs.length > 0 ? (
        <div className="relative overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[18rem] text-sm">
            <caption className="px-4 pt-3 text-left text-sm font-semibold text-ink-900">
              How units were charged
            </caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                <th scope="col" className="px-4 py-2 font-medium">Slab</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Units</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Rate</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {slabs.map((entry) => (
                <tr key={entry.fromUnits}>
                  <th scope="row" className="px-4 py-2 text-left font-normal text-ink-700">
                    {entry.toUnits === null
                      ? `${entry.fromUnits}+`
                      : `${entry.fromUnits === 0 ? 1 : entry.fromUnits}–${entry.toUnits}`}
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums">{entry.unitsCharged}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatRupeesPrecise(entry.ratePerUnit)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatRupeesPrecise(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <details className="group rounded-xl border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
          How this estimate was calculated
          <ChevronDownIcon className="size-4 text-ink-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 px-4 pb-4 text-sm leading-relaxed text-ink-600">
          <ol className="list-decimal space-y-1 pl-5">
            {result.summarySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div>
            <p className="font-medium text-ink-800">Assumptions</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {result.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-ink-800">Not included in this estimate</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {result.exclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <p>
            Read the full{" "}
            <Link href={routes.methodology} className="font-medium text-brand-700 underline underline-offset-2">
              methodology
            </Link>
            .
          </p>
        </div>
      </details>

      <SourceBlock
        title={`Tariff ${result.tariff.tariffReference} · version ${result.tariff.id}`}
        sources={[...result.tariff.sources, ...result.adjustmentSources]}
        lastVerifiedOn={result.tariff.lastVerifiedOn}
      />
      <p className="text-xs leading-relaxed text-ink-500">
        Tariff effective from {formatDate(result.tariff.effectiveFrom)}
        {result.tariff.effectiveTo ? ` to ${formatDate(result.tariff.effectiveTo)}` : ""}. This is an
        estimate, not an official electricity bill.
      </p>
    </div>
  );
}
