import Link from "next/link";
import { routes } from "@/config/routes";
import { getTool } from "@/data/tools";
import { unitCalculatorFaq } from "@/data/tool-faq";
import { DAYS_IN_PROJECTED_MONTH } from "@/lib/energy/calculate";
import { buildMetadata } from "@/lib/seo/metadata";
import { webApplicationSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { UnitCalculator } from "@/components/tools/UnitCalculator";
import {
  BillCheckCta,
  Formula,
  RelatedTools,
  ToolCard,
  ToolDisclaimer,
  ToolFaq,
} from "@/components/tools/ToolPageSections";

const tool = getTool("unit-calculator");
const DESCRIPTION =
  "Calculate electricity units (kWh) from your previous and current meter readings, with your average units per day and an estimate for a 30-day month.";

export const metadata = buildMetadata({
  title: "Electricity Unit Calculator (kWh)",
  description: DESCRIPTION,
  path: routes.unitCalculator,
});

export default function UnitCalculatorPage() {
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
        lead="Find out how many units of electricity you have used from two meter readings. One unit is one kilowatt-hour (kWh)."
      />

      <Container className="space-y-10 py-8 sm:py-12">
        <UnitCalculator />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ToolCard id="how-heading" title="How the unit calculator works">
            <p>
              Your electricity meter counts energy in kilowatt-hours. The reading only goes up, so the units you used are
              the difference between two readings.
            </p>
            <Formula
              lines={[
                "Units (kWh) = current reading − previous reading",
                "Average per day = units ÷ days between readings",
                `Units per month ≈ average per day × ${DAYS_IN_PROJECTED_MONTH}`,
              ]}
            />
            <p>
              The number of days is optional. Without it you still get the units, but not the daily average or the
              monthly estimate.
            </p>
          </ToolCard>

          <ToolCard id="example-heading" title="Worked example">
            <ul>
              <li>Previous reading: 10,250</li>
              <li>Current reading: 10,560</li>
              <li>Days between readings: 31</li>
            </ul>
            <p>
              Units = 10,560 − 10,250 = <strong>310 units</strong>. Average = 310 ÷ 31 = <strong>10 units a day</strong>.
              Estimated month = 10 × {DAYS_IN_PROJECTED_MONTH} = <strong>300 units</strong>.
            </p>
          </ToolCard>

          <ToolCard id="reading-heading" title="Reading your meter">
            <ul>
              <li>Note the reading at the same time of day if you can, and write down the date.</li>
              <li>
                Digital meters may cycle through several screens. Use the one for total energy, shown in kWh.
              </li>
              <li>
                Your bill usually shows the previous and current readings used for billing. Compare them with your own
                readings to check your usage.
              </li>
            </ul>
          </ToolCard>

          <ToolCard id="assumptions-heading" title="Assumptions and limits">
            <ul>
              <li>Both readings come from the same meter and are in kWh.</li>
              <li>The meter was not replaced between the two readings.</li>
              <li>
                The monthly estimate assumes the same daily usage for {DAYS_IN_PROJECTED_MONTH} days. Weather and
                seasons can change this a lot.
              </li>
              <li>
                Results are energy only. To estimate a rupee amount, use the{" "}
                <Link href={routes.electricityBillCalculator}>electricity bill calculator</Link>.
              </li>
            </ul>
          </ToolCard>
        </div>

        <BillCheckCta />
        <ToolFaq items={unitCalculatorFaq} />
        <RelatedTools current={tool.id} />
        <ToolDisclaimer>
          Results are calculated only from the readings you enter and are not an official bill or meter reading.
        </ToolDisclaimer>
      </Container>
    </>
  );
}
