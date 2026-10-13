import Link from "next/link";
import { routes } from "@/config/routes";
import { formatBillingMonth } from "@/lib/calculator/billing-month";
import { getDefaultBillingMonth, getEngine } from "@/lib/calculator/engine-registry";
import type { CalculationOutcome } from "@/lib/calculator/types";
import { formatDate, formatRupees } from "@/lib/format";
import { getSharedSchedule, getSources } from "@/lib/tariffs/overview";
import { Card } from "@/components/ui/Card";

/** Units people commonly look up ("100 unit bill", "400 unit bill"). */
const UNITS = [100, 200, 300, 400, 500, 700] as const;
/** Stated assumption: fixed charges depend on sanctioned load. */
const SANCTIONED_LOAD_KW = 2;
/** The tariff is the same for every covered provider, so any engine gives the same result. */
const REFERENCE_PROVIDER = "lesco" as const;

function total(outcome: CalculationOutcome): number | null {
  return outcome.status === "success" ? outcome.result.total : null;
}

/**
 * Estimated residential bills for common unit amounts, calculated at build
 * time by the same verified tariff engine the calculator uses. Nothing here
 * is typed by hand. Renders nothing if the engine or shared schedule is
 * unavailable.
 */
export function BillByUnitsTable({ headingId }: { headingId: string }) {
  const month = getDefaultBillingMonth();
  const engine = getEngine(REFERENCE_PROVIDER);
  const schedule = month ? getSharedSchedule(month) : null;
  if (!month || !engine || !schedule) return null;

  const run = (units: number, bandId: string) =>
    engine.calculate({
      providerId: REFERENCE_PROVIDER,
      consumerCategoryId: "residential",
      unitsConsumed: units,
      billingMonth: month,
      bandId,
      sanctionedLoadKw: SANCTIONED_LOAD_KW,
    });

  const rows = UNITS.map((units) => ({
    units,
    unprotected: total(run(units, "unprotected")),
    protected: units <= 200 ? total(run(units, "protected")) : null,
  }));
  if (rows.some((r) => r.unprotected === null)) return null;

  const sample = run(UNITS[0], "unprotected");
  const pending = sample.status === "success" ? sample.result.pendingAdjustments.map((p) => p.label) : [];
  const reference = getSources(schedule.sourceIds)[0]?.reference;
  const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 sm:px-4";
  const td = "px-3 py-2.5 tabular-nums sm:px-4";

  return (
    <Card as="section" aria-labelledby={headingId} padding="lg" className="min-w-0">
      <h2 id={headingId} className="text-xl font-semibold tracking-tight text-ink-950">
        Electricity bill by units: 100 to 700 units
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        Estimated residential bills for {formatBillingMonth(month)}, before taxes, for a {SANCTIONED_LOAD_KW} kW sanctioned
        load. Calculated with the tariff in force from {formatDate(schedule.effectiveFrom)}
        {reference ? ` (${reference})` : ""}, which applies to every provider on this website.
        {pending.length > 0 ? ` Not yet notified, so not included: ${pending.join(", ")}.` : ""}
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <caption className="sr-only">Estimated monthly electricity bill by units consumed</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={th}>Units a month</th>
              <th scope="col" className={`${th} text-right`}>Un-protected</th>
              <th scope="col" className={`${th} text-right`}>Protected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.units}>
                <th scope="row" className={`${td} text-left font-normal text-ink-700`}>
                  {r.units} units
                </th>
                <td className={`${td} text-right font-semibold text-ink-950`}>{formatRupees(r.unprotected!)}</td>
                <td className={`${td} text-right text-ink-700`}>
                  {r.protected !== null ? formatRupees(r.protected) : <span className="text-ink-500">Not eligible</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-500">
        Protected status only applies up to 200 units a month. Your bill also includes taxes and depends on your own
        sanctioned load and status, so use the calculator above for your exact figures. See{" "}
        <Link href={routes.billFormulaGuide} className="font-medium text-brand-700 underline underline-offset-2">
          how the bill is calculated
        </Link>
        , step by step.
      </p>
    </Card>
  );
}
