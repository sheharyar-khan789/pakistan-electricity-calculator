import type { ProviderId } from "@/data/providers";
import { getProvider } from "@/data/providers";
import { formatDate, formatRupeesPrecise } from "@/lib/format";
import {
  adjustmentsLastVerifiedOn,
  getAdjustmentRows,
  getScheduleFor,
  getSharedSchedule,
  getSources,
  scheduleSourceIds,
} from "@/lib/tariffs/overview";
import type { PeriodicAdjustment, Slab } from "@/lib/tariffs/types";
import { Card } from "@/components/ui/Card";
import { SourceBlock } from "@/components/ui/SourceBlock";

const slabRange = (s: Slab) => (s.toUnits === null ? `Above ${s.fromUnits - 1}` : `${s.fromUnits === 0 ? 1 : s.fromUnits}–${s.toUnits}`);

function rate(value: number, decimals = 2) {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}Rs. ${Math.abs(value).toFixed(decimals)}`;
}

const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 sm:px-4";
const td = "px-3 py-2.5 tabular-nums sm:px-4";

/**
 * Verified tariff rates for a provider, read from the tariff data layer.
 * Renders nothing if no verified schedule exists.
 */
export function TariffRatesTable({
  providerId,
  billingMonth,
  headingId,
}: {
  /** Omit to show the schedule shared by every provider (if there is one). */
  providerId?: ProviderId;
  billingMonth: string;
  headingId: string;
}) {
  const schedule = providerId ? getScheduleFor(providerId, billingMonth) : getSharedSchedule(billingMonth);
  if (!schedule) return null;
  const residential = schedule.categories.find((c) => c.categoryId === "residential");
  const commercial = schedule.categories.find((c) => c.categoryId === "commercial");

  return (
    <Card as="section" aria-labelledby={headingId} padding="lg" className="min-w-0">
      <h2 id={headingId} className="text-xl font-semibold tracking-tight text-ink-950">
        {providerId ? `${getProvider(providerId).shortName} tariff rates` : "Current tariff rates for supported providers"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        Government-applicable rates in force from {formatDate(schedule.effectiveFrom)}, before taxes and monthly
        adjustments. Fixed charges are per kW of sanctioned load per month. Applies to connections below{" "}
        {residential?.sanctionedLoadBelowKw ?? 5} kW that are not on time-of-use billing.
      </p>

      {residential ? (
        <div className="mt-5 space-y-5">
          {residential.bands.map((band) => (
            <div key={band.id} className="relative overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[19rem] text-sm">
                <caption className="px-3 pt-3 text-left text-sm font-semibold text-ink-900 sm:px-4">
                  Residential · {band.label}
                  <span className="block text-xs font-normal text-ink-500">
                    {band.pricing === "one-previous-slab-benefit"
                      ? "Benefit of one previous slab applies."
                      : "No slab benefit: all units at the rate of the slab your total falls in."}
                  </span>
                </caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className={th}>Units / month</th>
                    <th scope="col" className={`${th} text-right`}>Rate per unit</th>
                    <th scope="col" className={`${th} text-right`}>Fixed per kW</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {band.slabs.map((s) => (
                    <tr key={s.fromUnits}>
                      <th scope="row" className={`${td} text-left font-normal text-ink-700`}>{slabRange(s)}</th>
                      <td className={`${td} text-right`}>{formatRupeesPrecise(s.ratePerUnit)}</td>
                      <td className={`${td} text-right text-ink-600`}>
                        {s.fixedChargePerKwPerMonth !== undefined ? `Rs. ${s.fixedChargePerKwPerMonth}` : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : null}

      {commercial ? (
        <div className="relative mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[19rem] text-sm">
            <caption className="px-3 pt-3 text-left text-sm font-semibold text-ink-900 sm:px-4">
              Commercial · sanctioned load below {commercial.sanctionedLoadBelowKw} kW
            </caption>
            <tbody className="divide-y divide-line">
              {commercial.bands.map((band) => (
                <tr key={band.id}>
                  <th scope="row" className={`${td} text-left font-normal text-ink-700`}>Rate per unit</th>
                  <td className={`${td} text-right`}>{formatRupeesPrecise(band.slabs[0].ratePerUnit)}</td>
                </tr>
              ))}
              {commercial.bands.map((band) =>
                band.fixedCharge.kind === "per-consumer" ? (
                  <tr key={`${band.id}-fixed`}>
                    <th scope="row" className={`${td} text-left font-normal text-ink-700`}>Fixed charge per month</th>
                    <td className={`${td} text-right`}>Rs. {band.fixedCharge.amountPerMonth.toLocaleString("en-PK")}</td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-5">
        <SourceBlock
        title={`Source · tariff version ${schedule.id}`}
        sources={getSources(scheduleSourceIds(schedule, providerId))}
        lastVerifiedOn={schedule.lastVerifiedOn}
      />
      </div>
    </Card>
  );
}

function AdjustmentCell({ adj }: { adj: PeriodicAdjustment | null }) {
  if (!adj) return <span className="text-ink-500">Not yet notified</span>;
  return <span>{rate(adj.ratePerUnit, 4)}</span>;
}

/** FCA and QTA per bill month, with sources. */
export function AdjustmentsTable({ providerId, headingId }: { providerId?: ProviderId; headingId: string }) {
  const rows = getAdjustmentRows(providerId);
  if (rows.length === 0) return null;
  const used = rows.flatMap((r) => [r.fca, r.qta]).filter((a): a is PeriodicAdjustment => a !== null);
  const sourceIds = [...new Set(used.map((a) => a.sourceId))];

  return (
    <Card as="section" aria-labelledby={headingId} padding="lg" className="min-w-0">
      <h2 id={headingId} className="text-xl font-semibold tracking-tight text-ink-950">
        Monthly adjustments
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        Per-unit adjustments added to bills, kept separate from the base tariff. They do not apply to lifeline
        consumers. The fuel charges adjustment is charged on units billed two months earlier.
      </p>
      <div className="relative mt-5 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[20rem] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={th}>Bill month</th>
              <th scope="col" className={`${th} text-right`}>Fuel adjustment</th>
              <th scope="col" className={`${th} text-right`}>Quarterly adjustment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.billingMonth}>
                <th scope="row" className={`${td} text-left font-normal text-ink-700`}>{row.billingMonthLabel}</th>
                <td className={`${td} text-right`}><AdjustmentCell adj={row.fca} /></td>
                <td className={`${td} text-right`}><AdjustmentCell adj={row.qta} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-500">Rates per unit (kWh).</p>
      <div className="mt-5">
        <SourceBlock title="Adjustment decisions" sources={getSources(sourceIds)} lastVerifiedOn={adjustmentsLastVerifiedOn} />
      </div>
    </Card>
  );
}
