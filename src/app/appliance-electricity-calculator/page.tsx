import Link from "next/link";
import { routes } from "@/config/routes";
import { getTool } from "@/data/tools";
import { applianceCalculatorFaq } from "@/data/tool-faq";
import { getRateOptions } from "@/lib/energy/tariff-rates";
import { buildMetadata } from "@/lib/seo/metadata";
import { webApplicationSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApplianceCalculator } from "@/components/tools/ApplianceCalculator";
import {
  BillCheckCta,
  Formula,
  RateSourceCard,
  RelatedTools,
  ToolCard,
  ToolDisclaimer,
  ToolFaq,
} from "@/components/tools/ToolPageSections";

const tool = getTool("appliance-calculator");
const DESCRIPTION =
  "Calculate how many units (kWh) your appliances use per day and per month from their watts and hours of use, and estimate the cost at your rate per unit.";

export const metadata = buildMetadata({
  title: "Appliance Electricity Calculator",
  description: DESCRIPTION,
  path: routes.applianceCalculator,
});

export default function ApplianceCalculatorPage() {
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
        lead="See how many units your fans, lights, fridge, iron or any other appliance use, and what that may cost each month. Add as many appliances as you like."
      />

      <Container className="space-y-10 py-8 sm:py-12">
        <ApplianceCalculator rateOptions={rateOptions} />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ToolCard id="how-heading" title="How the appliance calculator works">
            <p>Electricity use depends on two things: how much power an appliance draws and for how long.</p>
            <Formula
              lines={[
                "Units per day (kWh) = watts × quantity × hours per day ÷ 1,000",
                "Units per month = units per day × days per month",
                "Estimated cost = units per month × rate per unit",
              ]}
            />
            <p>
              Dividing by 1,000 turns watt-hours into kilowatt-hours. One kilowatt-hour is one unit on your bill.
            </p>
          </ToolCard>

          <ToolCard id="example-heading" title="Worked examples">
            <ul>
              <li>
                A 100 W appliance for 1 hour: 100 × 1 ÷ 1,000 = <strong>0.1 units</strong>.
              </li>
              <li>
                The same appliance for 24 hours: 100 × 24 ÷ 1,000 = <strong>2.4 units a day</strong>, or 72 units over
                30 days.
              </li>
              <li>
                Three 75 W fans for 10 hours a day for 30 days: 75 × 3 × 10 ÷ 1,000 = 2.25 units a day ={" "}
                <strong>67.5 units a month</strong>.
              </li>
            </ul>
            <p>
              At an example rate of Rs. 40 per unit (not an official rate), 67.5 units would cost about Rs. 2,700. Use
              your own rate for your estimate.
            </p>
          </ToolCard>

          <ToolCard id="watts-heading" title="Finding the right numbers">
            <ul>
              <li>
                <strong>Watts:</strong> on the rating label, the box or the manual. 1 kW = 1,000 W.
              </li>
              <li>
                <strong>Hours per day:</strong> the time the appliance is actually switched on, from 0 to 24.
              </li>
              <li>
                <strong>Rate per unit:</strong> divide your last bill’s total by its units for a simple all-in rate, or
                pick your tariff slab from the official list. Leave it empty to see units only.
              </li>
            </ul>
          </ToolCard>

          <ToolCard id="assumptions-heading" title="Assumptions and limits">
            <ul>
              <li>Each appliance draws the power you enter for every hour you enter.</li>
              <li>
                Appliances with a thermostat or that cycle on and off, such as fridges, ACs, irons and geysers, usually
                use less than this.
              </li>
              <li>
                Standby power, wiring losses and power factor are not included.
              </li>
              <li>
                The cost uses one rate for every unit. Your real bill applies slabs to your household’s total units and
                adds fixed charges, adjustments and taxes. For that, use the{" "}
                <Link href={routes.electricityBillCalculator}>electricity bill calculator</Link>.
              </li>
            </ul>
          </ToolCard>
        </div>

        <RateSourceCard rateOptions={rateOptions} />
        <BillCheckCta />
        <ToolFaq items={applianceCalculatorFaq} />
        <RelatedTools current={tool.id} />
        <ToolDisclaimer />
      </Container>
    </>
  );
}
