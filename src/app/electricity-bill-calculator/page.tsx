import Link from "next/link";
import { routes } from "@/config/routes";
import { getMainCalculator } from "@/data/calculators";
import { buildMetadata } from "@/lib/seo/metadata";
import { webApplicationSchema } from "@/lib/seo/schema";
import { CalculatorStatusBadge } from "@/components/calculator/CalculatorStatusBadge";
import {
  EngineStatusNotice,
  FindUnitsTip,
  ProviderLinks,
  ResultExplainer,
  TariffSourcesPending,
} from "@/components/calculator/CalculatorPageSections";
import { getDefaultBillingMonth } from "@/lib/calculator/engine-registry";
import { ElectricityCalculator } from "@/components/calculator/ElectricityCalculator";
import { AdjustmentsTable, TariffRatesTable } from "@/components/tariffs/TariffTables";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { BillCheckCta, RelatedTools } from "@/components/tools/ToolPageSections";
import { getSharedSchedule, getSources } from "@/lib/tariffs/overview";
import { formatDate } from "@/lib/format";

const TITLE = "Electricity Bill Calculator";
const DESCRIPTION =
  "Estimate your monthly electricity bill in Pakistan. Select your provider and consumer type, enter units or meter readings and see a clear breakdown.";

export const metadata = buildMetadata({
  title: `${TITLE} Pakistan`,
  description: DESCRIPTION,
  path: routes.electricityBillCalculator,
});

export default function ElectricityBillCalculatorPage() {
  const calculator = getMainCalculator();
  const available = calculator.status === "available";
  const billingMonth = getDefaultBillingMonth();
  const schedule = available && billingMonth ? getSharedSchedule(billingMonth) : null;
  const tariffReference = schedule ? getSources(schedule.sourceIds)[0]?.reference : undefined;

  return (
    <>
      {available ? (
        <JsonLd
          data={webApplicationSchema({
            name: TITLE,
            description: DESCRIPTION,
            path: routes.electricityBillCalculator,
          })}
        />
      ) : null}
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: TITLE, path: routes.electricityBillCalculator },
        ]}
        title={TITLE}
        meta={
          <>
            <CalculatorStatusBadge status={calculator.status} />
            {schedule ? (
              <Badge tone="neutral">
                Tariff from {formatDate(schedule.effectiveFrom)}
                {tariffReference ? ` · ${tariffReference}` : ""}
              </Badge>
            ) : null}
          </>
        }
        lead={
          <>
            Estimate your monthly electricity bill. Select your provider and consumer type, then enter the units you used
            or your meter readings. Looking for your actual bill?{" "}
            <Link href={routes.billCheck} className="font-semibold text-brand-700 underline underline-offset-2">
              Check your electricity bill online
            </Link>
            .
          </>
        }
      />

      <Container className="space-y-8 py-8 sm:py-12">
        {!available ? <EngineStatusNotice /> : null}
        <ElectricityCalculator layout="split" defaultBillingMonth={billingMonth} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ResultExplainer />
          <div className="space-y-6">
            <FindUnitsTip />
            {!available ? <TariffSourcesPending /> : null}
          </div>
        </div>

        {available && billingMonth ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <TariffRatesTable billingMonth={billingMonth} headingId="tariff-rates-heading" />
            <AdjustmentsTable headingId="adjustments-heading" />
          </div>
        ) : null}

        <BillCheckCta />
        <ProviderLinks headingId="provider-links-heading" />
        <RelatedTools current="bill-calculator" />
      </Container>
    </>
  );
}
