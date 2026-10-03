import Link from "next/link";
import { routes } from "@/config/routes";
import { getProvider } from "@/data/providers";
import { getTool } from "@/data/tools";
import { touCalculatorFaq } from "@/data/tool-faq";
import { formatBillingMonth } from "@/lib/calculator/billing-month";
import { getDefaultBillingMonth } from "@/lib/calculator/engine-registry";
import { getTouTariff, touProviders } from "@/lib/calculator/tou";
import { formatDate, formatRupees, formatRupeesPrecise } from "@/lib/format";
import { adjustmentData } from "@/lib/tariffs";
import { getSources, scheduleSourceIds } from "@/lib/tariffs/overview";
import { buildMetadata } from "@/lib/seo/metadata";
import { webApplicationSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { Alert } from "@/components/ui/Alert";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { SourceBlock } from "@/components/ui/SourceBlock";
import { TouCalculator } from "@/components/tools/TouCalculator";
import {
  BillCheckCta,
  Formula,
  RelatedTools,
  ToolCard,
  ToolDisclaimer,
  ToolFaq,
} from "@/components/tools/ToolPageSections";

const tool = getTool("tou-calculator");
const DESCRIPTION =
  "Estimate a time-of-use (TOU) electricity bill in Pakistan for residential and commercial connections of 5 kW and above, from peak and off-peak units and MDI.";

export const metadata = buildMetadata({
  title: "TOU Electricity Bill Calculator (5 kW+)",
  description: DESCRIPTION,
  path: routes.touCalculator,
});

const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 sm:px-4";
const td = "px-3 py-2.5 tabular-nums sm:px-4";

export default function TouCalculatorPage() {
  const providerIds = touProviders();
  const months = adjustmentData.supportedBillingMonths.filter((m) => providerIds.some((p) => getTouTariff(p, "residential", m)));
  const defaultMonth = getDefaultBillingMonth();
  const reference = defaultMonth && providerIds[0] ? getTouTariff(providerIds[0], "residential", defaultMonth) : null;
  const schedule = reference?.schedule ?? null;
  const residential = schedule?.timeOfUse?.find((t) => t.categoryId === "residential");
  const commercial = schedule?.timeOfUse?.find((t) => t.categoryId === "commercial");
  // Group companies whose notified hours are identical, keeping each one's own source.
  const groups = new Map<string, { key: string; providers: string[]; references: string[]; periods: readonly { months: string; peak: string }[]; note: string }>();
  for (const h of schedule?.peakHours ?? []) {
    const key = JSON.stringify([h.periods, h.note]);
    const g = groups.get(key) ?? { key, providers: [], references: [], periods: h.periods, note: h.note };
    g.providers.push(getProvider(h.providerId).shortName);
    const ref = getSources([h.sourceId])[0]?.reference;
    if (ref) g.references.push(ref);
    groups.set(key, g);
  }
  const peakHourGroups = [...groups.values()];
  const uncovered = providerIds
    .filter((p) => !(schedule?.peakHours ?? []).some((h) => h.providerId === p))
    .map((p) => getProvider(p).shortName);

  // Worked example built from the verified rates, never typed here.
  const example = residential
    ? {
        peak: 200 * residential.peakRatePerUnit,
        offPeak: 800 * residential.offPeakRatePerUnit,
        demand: 6 * residential.billingDemand.sanctionedLoadShare,
        fixed: 6 * residential.billingDemand.sanctionedLoadShare * residential.fixedChargePerKwPerMonth,
      }
    : null;

  return (
    <>
      {schedule ? <JsonLd data={webApplicationSchema({ name: tool.title, description: DESCRIPTION, path: tool.href })} /> : null}
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Calculators", path: routes.calculators },
          { name: tool.title, path: tool.href },
        ]}
        title={tool.title}
        lead={
          <>
            Estimate a time-of-use bill for a residential or commercial connection of 5 kW and above, from the peak and
            off-peak units on your bill. For smaller connections, use the{" "}
            <Link href={routes.electricityBillCalculator} className="font-semibold text-brand-700 underline underline-offset-2">
              electricity bill calculator
            </Link>
            .
          </>
        }
      />

      <Container className="space-y-10 py-8 sm:py-12">
        {schedule ? (
          <TouCalculator
            providerIds={providerIds}
            billingMonths={months.map((m) => ({ value: m, label: formatBillingMonth(m) }))}
            defaultBillingMonth={defaultMonth}
          />
        ) : (
          <Alert tone="warning" title="Time-of-use estimates are not available">
            <p>Verified time-of-use tariff data is not connected right now, so no figures are shown.</p>
          </Alert>
        )}

        {schedule && residential && commercial ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <ToolCard id="rates-heading" title="Time-of-use rates">
              <p>
                Government-applicable rates in force from {formatDate(schedule.effectiveFrom)}, before taxes and monthly
                adjustments.
              </p>
              <div className="relative overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className={th}>Rate</th>
                      <th scope="col" className={`${th} text-right`}>Residential A-1(b)</th>
                      <th scope="col" className={`${th} text-right`}>Commercial A-2(c)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <th scope="row" className={`${td} text-left font-normal text-ink-700`}>Peak, per unit</th>
                      <td className={`${td} text-right`}>{formatRupeesPrecise(residential.peakRatePerUnit)}</td>
                      <td className={`${td} text-right`}>{formatRupeesPrecise(commercial.peakRatePerUnit)}</td>
                    </tr>
                    <tr>
                      <th scope="row" className={`${td} text-left font-normal text-ink-700`}>Off-peak, per unit</th>
                      <td className={`${td} text-right`}>{formatRupeesPrecise(residential.offPeakRatePerUnit)}</td>
                      <td className={`${td} text-right`}>{formatRupeesPrecise(commercial.offPeakRatePerUnit)}</td>
                    </tr>
                    <tr>
                      <th scope="row" className={`${td} text-left font-normal text-ink-700`}>Fixed, per kW a month</th>
                      <td className={`${td} text-right`}>{formatRupees(residential.fixedChargePerKwPerMonth)}</td>
                      <td className={`${td} text-right`}>{formatRupees(commercial.fixedChargePerKwPerMonth)}</td>
                    </tr>
                    <tr>
                      <th scope="row" className={`${td} text-left font-normal text-ink-700`}>Fixed charge applies to</th>
                      <td className={`${td} text-right`}>
                        {Math.round(residential.billingDemand.sanctionedLoadShare * 100)}% of load or MDI
                      </td>
                      <td className={`${td} text-right`}>
                        {Math.round(commercial.billingDemand.sanctionedLoadShare * 100)}% of load or MDI
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <SourceBlock
                title={`Source · tariff version ${schedule.id}`}
                sources={getSources(scheduleSourceIds(schedule))}
                lastVerifiedOn={schedule.lastVerifiedOn}
              />
            </ToolCard>

            <ToolCard id="how-heading" title="How the TOU estimate works">
              <Formula
                lines={[
                  "Peak charges = peak units × peak rate",
                  "Off-peak charges = off-peak units × off-peak rate",
                  "Billing demand = higher of (share × sanctioned load) and MDI",
                  "Fixed charges = billing demand × fixed rate per kW",
                  "Adjustments = (peak + off-peak units) × FCA and QTA",
                ]}
              />
              <p>
                There are no slabs on time-of-use tariffs. The fuel charges adjustment (FCA) and quarterly tariff adjustment
                (QTA) are added only where NEPRA has notified them for the bill month. Otherwise the result says they are not
                yet notified.
              </p>
            </ToolCard>

            {example ? (
              <ToolCard id="example-heading" title="Worked example">
                <p>A residential TOU connection with a 6 kW sanctioned load, 200 peak units, 800 off-peak units and no MDI entered:</p>
                <ul>
                  <li>Peak: 200 × {formatRupeesPrecise(residential.peakRatePerUnit)} = {formatRupeesPrecise(example.peak)}</li>
                  <li>Off-peak: 800 × {formatRupeesPrecise(residential.offPeakRatePerUnit)} = {formatRupeesPrecise(example.offPeak)}</li>
                  <li>
                    Fixed: {Math.round(residential.billingDemand.sanctionedLoadShare * 100)}% × 6 kW = {example.demand} kW ×{" "}
                    {formatRupees(residential.fixedChargePerKwPerMonth)} = {formatRupeesPrecise(example.fixed)}
                  </li>
                </ul>
                <p>
                  That is <strong>{formatRupeesPrecise(example.peak + example.offPeak + example.fixed)}</strong> before
                  adjustments and taxes. The FCA and QTA for your bill month are then added on all 1,000 units.
                </p>
              </ToolCard>
            ) : null}

            <ToolCard id="peak-hours-heading" title="Peak hours">
              {peakHourGroups.map((g) => (
                <div key={g.key}>
                  <p>
                    {g.providers.join(", ")}, as stated in {g.references.join(", ")}:
                  </p>
                  <ul>
                    {g.periods.map((p) => (
                      <li key={p.months}>
                        {p.months}: {p.peak}
                      </li>
                    ))}
                  </ul>
                  <p>{g.note}</p>
                </div>
              ))}
              {uncovered.length > 0 ? (
                <p>
                  Peak hours for {uncovered.join(", ")} are not shown because they have not been verified.
                  {uncovered.includes("K-Electric")
                    ? " K-Electric’s documents differ: S.R.O. 1643(I)/2026 annexes different hours, while S.R.O. 52(I)/2026 keeps its earlier terms in force. Check the hours with K-Electric."
                    : ""}
                </p>
              ) : null}
              <p>You do not need peak hours to use the calculator: your bill gives peak and off-peak units separately.</p>
            </ToolCard>

            <ToolCard id="assumptions-heading" title="Assumptions and limits">
              <ul>
                <li>Your connection has a TOU meter and is billed on tariff A-1(b) (residential) or A-2(c) (commercial).</li>
                <li>
                  Not every 5 kW+ connection is billed this way. Under the terms, existing commercial connections of 5 kW and
                  above are billed on A-2(b), a single rate per unit, until a TOU meter is installed. This calculator does not
                  cover A-2(b).
                </li>
                <li>
                  Without an MDI, fixed charges use the sanctioned-load share. If your recorded MDI is higher, fixed charges
                  will be higher.
                </li>
                <li>
                  NEPRA charges the FCA on units billed in an earlier month. The estimate applies it to the units you enter.
                </li>
                <li>Taxes, power factor penalties, arrears and other account-specific items are not included.</li>
                <li>Industrial, agricultural, bulk and other TOU tariffs are not covered.</li>
              </ul>
            </ToolCard>
          </div>
        ) : null}

        <BillCheckCta />
        <ToolFaq items={touCalculatorFaq} />
        <RelatedTools current={tool.id} />
        <ToolDisclaimer>Results are estimates for planning only and are not an official bill.</ToolDisclaimer>
      </Container>
    </>
  );
}
