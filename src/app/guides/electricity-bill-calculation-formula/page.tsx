import Link from "next/link";
import { routes } from "@/config/routes";
import { getGuide } from "@/data/guides";
import { formatBillingMonth } from "@/lib/calculator/billing-month";
import { getDefaultBillingMonth, getEngine } from "@/lib/calculator/engine-registry";
import type { CalculationResult } from "@/lib/calculator/types";
import { formatDate, formatRupees, formatRupeesPrecise } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSharedSchedule, getSources } from "@/lib/tariffs/overview";
import type { Slab } from "@/lib/tariffs/types";
import { Formula } from "@/components/tools/ToolPageSections";
import { ProsePage } from "@/components/ui/ProsePage";

const guide = getGuide("electricity-bill-calculation-formula");

export const metadata = buildMetadata({
  title: guide.title,
  description: guide.description,
  path: routes.billFormulaGuide,
  // The guide title is long enough on its own; the site-name suffix would get cut off in search results.
  absoluteTitle: true,
});

/** Stated assumptions for the worked examples. */
const LOAD_KW = 2;
const EXAMPLE_UNITS = 250;
const PROTECTED_UNITS = 150;
/** The tariff is the same for every covered provider, so any engine gives the same result. */
const REFERENCE_PROVIDER = "lesco" as const;

const slabRange = (s: Slab) =>
  s.fromUnits === 0 ? `Up to ${s.toUnits}` : s.toUnits === null ? `Above ${s.fromUnits - 1}` : `${s.fromUnits}–${s.toUnits}`;

/** Every figure on this page comes from the verified tariff data and engine, never typed here. */
function facts() {
  const month = getDefaultBillingMonth();
  const schedule = month ? getSharedSchedule(month) : null;
  const engine = getEngine(REFERENCE_PROVIDER);
  if (!month || !schedule || !engine) return null;
  const residential = schedule.categories.find((c) => c.categoryId === "residential");
  const unprotected = residential?.bands.find((b) => b.id === "unprotected");
  const protectedBand = residential?.bands.find((b) => b.id === "protected");
  if (!residential || !unprotected || !protectedBand) return null;

  const run = (units: number, bandId: string): CalculationResult | null => {
    const outcome = engine.calculate({
      providerId: REFERENCE_PROVIDER,
      consumerCategoryId: "residential",
      unitsConsumed: units,
      billingMonth: month,
      bandId,
      sanctionedLoadKw: LOAD_KW,
    });
    return outcome.status === "success" ? outcome.result : null;
  };
  const example = run(EXAMPLE_UNITS, "unprotected");
  const protectedExample = run(PROTECTED_UNITS, "protected");
  const atBoundary = protectedBand.maxUnits ? run(protectedBand.maxUnits, "unprotected") : null;
  const pastBoundary = protectedBand.maxUnits ? run(protectedBand.maxUnits + 1, "unprotected") : null;
  if (!example || !protectedExample || !atBoundary || !pastBoundary) return null;

  return {
    month,
    schedule,
    reference: getSources(schedule.sourceIds)[0]?.reference,
    touKw: residential.sanctionedLoadBelowKw,
    unprotected,
    protectedBand,
    example,
    protectedExample,
    atBoundary,
    pastBoundary,
  };
}

const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 sm:px-4";
const td = "px-3 py-2.5 align-top sm:px-4";

function BreakdownTable({ result, caption }: { result: CalculationResult; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={th}>Charge</th>
            <th scope="col" className={th}>How it is worked out</th>
            <th scope="col" className={`${th} text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {result.breakdown.lines.map((line) => (
            <tr key={line.id}>
              <th scope="row" className={`${td} text-left font-normal text-ink-800`}>{line.label}</th>
              <td className={`${td} text-ink-600`}>{line.detail}</td>
              <td className={`${td} text-right tabular-nums text-ink-900`}>{formatRupeesPrecise(line.amount)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" colSpan={2} className={`${td} text-left font-semibold text-ink-950`}>
              Bill before taxes
            </th>
            <td className={`${td} text-right font-semibold tabular-nums text-ink-950`}>{formatRupeesPrecise(result.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function BillFormulaGuide() {
  const f = facts();
  const pending = f?.example.pendingAdjustments.map((p) => p.label) ?? [];
  const adjustmentLines = f?.example.breakdown.lines.filter((l) => l.group === "adjustment") ?? [];

  return (
    <ProsePage
      title={guide.title}
      path={routes.billFormulaGuide}
      parent={{ name: "Guides", path: routes.guides }}
      lastUpdated={guide.reviewedOn}
      lead="A residential electricity bill from LESCO, IESCO, MEPCO, K-Electric or any other provider is worked out in the same few steps. Here is the formula, with real examples."
    >
      <p>
        To skip the arithmetic, enter your units in the{" "}
        <Link href={routes.electricityBillCalculator}>electricity bill calculator</Link>. To see your actual bill, use
        the <Link href={routes.billCheck}>electricity bill check</Link>.
      </p>

      <h2>The formula</h2>
      <Formula
        lines={[
          "Electricity charges = units × rate per unit of your slab",
          "Fixed charges = sanctioned load (kW) × fixed charge per kW of your slab",
          "Adjustments = units × (FCA + QTA per unit)",
          "Bill before taxes = electricity charges + fixed charges + adjustments",
        ]}
      />
      <p>
        Taxes such as General Sales Tax and electricity duty are added on top. They depend on your province and tax
        status, so they are not part of this formula.
      </p>

      {f ? (
        <>
          <h2>Step 1: find your slab</h2>
          <p>
            Your slab is the range your total units for the month fall in. For most homes (un-protected), every unit is
            charged at the rate of that one slab. These are the residential rates in force from{" "}
            {formatDate(f.schedule.effectiveFrom)}
            {f.reference ? `, notified in ${f.reference}` : ""}, which apply to every provider on this website:
          </p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <caption className="sr-only">Un-protected residential slab rates and fixed charges</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className={th}>Units a month</th>
                  <th scope="col" className={`${th} text-right`}>Rate per unit</th>
                  <th scope="col" className={`${th} text-right`}>Fixed charge per kW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {f.unprotected.slabs.map((s) => (
                  <tr key={s.fromUnits}>
                    <th scope="row" className={`${td} text-left font-normal text-ink-800`}>{slabRange(s)}</th>
                    <td className={`${td} text-right tabular-nums`}>{formatRupeesPrecise(s.ratePerUnit)}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {s.fixedChargePerKwPerMonth !== undefined ? formatRupees(s.fixedChargePerKwPerMonth) : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>
            Step 2: an example with {EXAMPLE_UNITS} units
          </h2>
          <p>
            Take an un-protected home that used {EXAMPLE_UNITS} units, with a {LOAD_KW} kW sanctioned load. Its{" "}
            {formatBillingMonth(f.month)} bill works out like this:
          </p>
          <BreakdownTable result={f.example} caption={`Bill for ${EXAMPLE_UNITS} units, un-protected, ${LOAD_KW} kW`} />
          <ul>
            {f.example.summarySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          {pending.length > 0 ? (
            <p>
              Not yet notified when this page was built, so not included: {pending.join(", ")}. Once NEPRA notifies it,
              it is added per unit in the same way.
            </p>
          ) : null}
          {adjustmentLines.length === 0 ? (
            <p>No adjustment had been notified for this bill month, so none is added.</p>
          ) : null}

          <h2>Why one extra unit can cost hundreds of rupees</h2>
          <p>
            Because every unit is charged at the rate of the slab your total falls in, crossing into the next slab
            raises the rate for all your units, and the fixed charge per kW can rise too. With a {LOAD_KW} kW
            sanctioned load:
          </p>
          <ul>
            <li>
              {f.atBoundary.input.unitsConsumed} units: <strong>{formatRupees(f.atBoundary.total)}</strong>
            </li>
            <li>
              {f.pastBoundary.input.unitsConsumed} units: <strong>{formatRupees(f.pastBoundary.total)}</strong>
            </li>
          </ul>
          <p>
            That is {formatRupees(f.pastBoundary.total - f.atBoundary.total)} more for one unit, before taxes. Keeping
            an eye on your meter near the end of a slab can make a real difference.
          </p>

          <h2>Protected consumers: one previous slab benefit</h2>
          <p>
            Homes that used {f.protectedBand.maxUnits} units or less every month for the past 6 months are protected.
            They pay lower rates, and only the units above the previous slab are charged at the higher rate. For{" "}
            {PROTECTED_UNITS} units with a {LOAD_KW} kW sanctioned load:
          </p>
          <BreakdownTable
            result={f.protectedExample}
            caption={`Bill for ${PROTECTED_UNITS} units, protected, ${LOAD_KW} kW`}
          />
          <p>
            Protected status is decided by your provider. Going above {f.protectedBand.maxUnits} units in a month
            moves you to un-protected rates.
          </p>

          <h2>Lifeline and bigger connections</h2>
          <p>
            Lifeline consumers (single phase, small load and low use) pay the lowest rates and no fixed charges.
            Connections of {f.touKw} kW and above are billed on time-of-use rates with separate peak and off-peak
            units; use the <Link href={routes.touCalculator}>TOU bill calculator</Link> for those.
          </p>
        </>
      ) : null}

      <h2>Check your own bill</h2>
      <p>
        The <Link href={routes.electricityBillCalculator}>electricity bill calculator</Link> applies this formula to your
        own units, consumer status and sanctioned load. For what each line on your bill means, read{" "}
        <Link href={routes.billExplainedGuide}>understand your electricity bill</Link>. The documents behind every rate
        are on the <Link href={routes.sources}>sources page</Link>.
      </p>
    </ProsePage>
  );
}
