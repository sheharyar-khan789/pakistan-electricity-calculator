import Link from "next/link";
import { routes } from "@/config/routes";
import { getTool } from "@/data/tools";
import { acCalculatorFaq } from "@/data/tool-faq";
import { getRateOptions } from "@/lib/energy/tariff-rates";
import { acEnergy } from "@/lib/energy/calculate";
import { formatKwhNumber } from "@/lib/energy/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { webApplicationSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { Alert } from "@/components/ui/Alert";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { AcCalculator } from "@/components/tools/AcCalculator";
import {
  BillCheckCta,
  Formula,
  RateSourceCard,
  RelatedTools,
  ToolCard,
  ToolDisclaimer,
  ToolFaq,
} from "@/components/tools/ToolPageSections";

const tool = getTool("ac-calculator");

// Example rating-label input powers for the "1.5 ton" section, computed with the calculator's own formula.
const TON_HOURS = 8;
const TON_DAYS = 30;
const tonRows = [1000, 1500, 2000].map((watts) => {
  const e = acEnergy({ watts, quantity: 1, hoursPerDay: TON_HOURS, daysPerMonth: TON_DAYS, runningSharePercent: 100 });
  return { watts, daily: e.dailyKwh, monthly: e.monthlyKwh };
});
const DESCRIPTION =
  "Estimate the units and monthly electricity cost of running an air conditioner from its rated input power, hours of use and your rate per unit.";

export const metadata = buildMetadata({
  title: "AC Electricity Cost Calculator",
  description: DESCRIPTION,
  path: routes.acCalculator,
});

export default function AcCalculatorPage() {
  const rateOptions = getRateOptions();
  return (
    <>
      <JsonLd data={webApplicationSchema({ name: tool.title, description: DESCRIPTION, path: tool.href })} />
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Calculators", path: routes.calculators },
          { name: tool.title, path: tool.href },
        ]}
        title={tool.title}
        lead="Estimate how many units your air conditioner uses and what it may cost to run each month, from the power on its rating label and how long you use it."
      />

      <Container className="space-y-10 py-8 sm:py-12">
        <AcCalculator rateOptions={rateOptions} />

        <Alert tone="info" title="AC power use varies">
          <p>
            An AC does not draw the same power all the time. Outdoor temperature, thermostat setting, room size,
            insulation, maintenance and the model all change it. Inverter ACs vary their power continuously. Treat the
            result as an estimate, not a measurement.
          </p>
        </Alert>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ToolCard id="how-heading" title="How the AC cost calculator works">
            <Formula
              lines={[
                "Power used (W) = rated input power × time at rated power ÷ 100",
                "Units per day = power used × number of ACs × hours ÷ 1,000",
                "Units per month = units per day × days per month",
                "Estimated cost = units per month × rate per unit",
              ]}
            />
            <p>
              With time at rated power set to 100%, the calculator assumes the AC draws its rated input power for every
              hour it is on.
            </p>
          </ToolCard>

          <ToolCard id="example-heading" title="Worked example">
            <p>One AC with a rated input power of 1,800 W, used 8 hours a day for 30 days, at 100%:</p>
            <ul>
              <li>Units per day = 1,800 × 1 × 8 ÷ 1,000 = 14.4 units</li>
              <li>Units per month = 14.4 × 30 = <strong>432 units</strong></li>
            </ul>
            <p>
              At an example rate of Rs. 40 per unit (not an official rate), that is about Rs. 17,280. Use your own
              AC’s rating and your own rate for your estimate.
            </p>
          </ToolCard>

          <ToolCard id="power-heading" title="Which power figure to use">
            <ul>
              <li>
                Use the <strong>rated input power</strong> (W or kW) on the indoor unit’s label or in the manual. If
                both cooling and heating figures are listed, use the cooling one.
              </li>
              <li>
                Do <strong>not</strong> use the cooling capacity in tons or BTU/h. That is the heat the AC removes, not the
                electricity it uses.
              </li>
              <li>
                A plug-in energy meter or your own meter readings (see the{" "}
                <Link href={routes.unitCalculator}>unit calculator</Link>) show what your AC actually uses.
              </li>
            </ul>
          </ToolCard>

          <ToolCard id="ton-heading" title="How many units does a 1.5 ton AC use?">
            <p>
              “1.5 ton” is the AC’s cooling capacity, not its electricity use. Two 1.5 ton ACs can use quite different amounts
              of electricity, depending on the model, inverter or non-inverter, and how they are used. To find your AC’s
              units, read the <strong>input power</strong> on its rating label and enter it in the calculator above.
            </p>
            <p>
              The table shows what different label values mean for {TON_HOURS} hours a day over {TON_DAYS} days at full power.
              These are example label values, not figures for any particular AC.
            </p>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <caption className="sr-only">Units used by an AC for example input power values</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Input power on label</th>
                    <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Units a day</th>
                    <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500">Units a month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tonRows.map((r) => (
                    <tr key={r.watts}>
                      <th scope="row" className="px-3 py-2.5 text-left font-normal text-ink-700">{r.watts.toLocaleString("en-PK")} W</th>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatKwhNumber(r.daily)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatKwhNumber(r.monthly)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Real use is usually different, because the compressor cycles or slows down once the room is cool. Your bill
              total also depends on your tariff slab. See the <Link href={routes.electricityBillCalculator}>electricity bill
              calculator</Link>.
            </p>
          </ToolCard>

          <ToolCard id="assumptions-heading" title="Assumptions and limits">
            <ul>
              <li>No saving is assumed for inverter models. Enter your own AC’s figures.</li>
              <li>The estimate covers the AC only, not the rest of your home.</li>
              <li>
                The cost uses one rate for every unit. A large AC load can move your household into a higher tariff slab,
                which the <Link href={routes.electricityBillCalculator}>electricity bill calculator</Link> shows for your
                total units.
              </li>
              <li>Fixed charges and taxes are not included.</li>
            </ul>
          </ToolCard>
        </div>

        <RateSourceCard rateOptions={rateOptions} />
        <BillCheckCta />
        <ToolFaq items={acCalculatorFaq} />
        <RelatedTools current={tool.id} />
        <ToolDisclaimer />
      </Container>
    </>
  );
}
