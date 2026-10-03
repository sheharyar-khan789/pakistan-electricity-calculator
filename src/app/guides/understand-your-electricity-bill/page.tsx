import Link from "next/link";
import { routes } from "@/config/routes";
import { getGuide } from "@/data/guides";
import { getDefaultBillingMonth } from "@/lib/calculator/engine-registry";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { adjustmentData } from "@/lib/tariffs";
import { getSharedSchedule, getSources } from "@/lib/tariffs/overview";
import { OtherBillChecks } from "@/components/bill-check/BillCheckSections";
import { ProsePage } from "@/components/ui/ProsePage";

const guide = getGuide("understand-your-electricity-bill");

export const metadata = buildMetadata({
  title: guide.title,
  description: guide.description,
  path: routes.billExplainedGuide,
});

/** Figures quoted below come from the verified tariff data, never typed here. */
function facts() {
  const month = getDefaultBillingMonth();
  const schedule = month ? getSharedSchedule(month) : null;
  const residential = schedule?.categories.find((c) => c.categoryId === "residential");
  const band = (id: string) => residential?.bands.find((b) => b.id === id);
  return {
    schedule,
    reference: schedule ? getSources(schedule.sourceIds)[0]?.reference : undefined,
    touKw: residential?.sanctionedLoadBelowKw,
    protectedUnits: band("protected")?.maxUnits,
    lifelineUnits: band("lifeline")?.maxUnits,
    lifelineKw: band("lifeline")?.maxSanctionedLoadKw,
    fcaLag: adjustmentData.fcaBillingLagMonths,
  };
}

export default function UnderstandYourBillGuide() {
  const f = facts();
  return (
    <ProsePage
      title={guide.title}
      path={routes.billExplainedGuide}
      parent={{ name: "Guides", path: routes.guides }}
      lastUpdated={guide.reviewedOn}
      lead="A Pakistani electricity bill combines charges for the units you used with fixed charges, monthly adjustments and taxes. Here is what each part means."
    >
      <p>
        To see your actual bill, use the <Link href={routes.billCheck}>electricity bill check</Link>. To estimate a bill
        from units, use the <Link href={routes.electricityBillCalculator}>bill calculator</Link>.
      </p>

      <h2>The numbers that identify you</h2>
      <p>
        Your bill carries the numbers you use to look it up online: a reference number and Customer ID for ex-WAPDA
        companies, or an account number for K-Electric. The{" "}
        <Link href={routes.referenceNumberGuide}>reference number guide</Link> explains each one.
      </p>

      <h2>Units and bill month</h2>
      <p>
        Units are the kilowatt-hours (kWh) you used in the billing period, worked out from your previous and current meter
        readings. Monthly adjustments are notified per <strong>bill month</strong>, so the same units can cost a different
        amount in different months.
      </p>

      <h2>Consumer status and slabs</h2>
      <p>Residential tariffs charge different rates depending on how many units you use and your consumer status:</p>
      <ul>
        <li>
          <strong>Un-protected</strong>: every unit is charged at the rate of the slab your total falls in.
        </li>
        <li>
          <strong>Protected</strong>
          {f.protectedUnits ? ` (up to ${f.protectedUnits} units a month, consistently for the past 6 months)` : ""}: you
          get the benefit of one previous slab, so part of your units are charged at a lower rate.
        </li>
        <li>
          <strong>Lifeline</strong>
          {f.lifelineUnits && f.lifelineKw ? ` (single phase, up to ${f.lifelineKw} kW, up to ${f.lifelineUnits} units)` : ""}:
          the lowest rates, with no fixed charges.
        </li>
      </ul>
      <p>Your provider decides your status using official criteria.</p>

      <h2>Fixed charges and sanctioned load</h2>
      <p>
        Most residential consumers pay fixed charges based on their <strong>sanctioned load</strong> (in kW), the
        maximum load approved for your connection. The rate per kW depends on your consumption slab.
        {f.touKw ? (
          <>
            {" "}
            Connections of {f.touKw} kW and above are billed on time-of-use tariffs with peak and off-peak rates; estimate
            those with the <Link href={routes.touCalculator}>TOU bill calculator</Link>.
          </>
        ) : null}
      </p>

      <h2>Monthly adjustments</h2>
      <ul>
        <li>
          <strong>Fuel charges adjustment (FCA)</strong>: reflects the actual cost of fuel used to generate electricity. NEPRA
          decides it for each month, and it is charged in the bill {f.fcaLag} months later on the units billed in that
          earlier month.
        </li>
        <li>
          <strong>Quarterly tariff adjustment (QTA)</strong>: adjusts for other power purchase costs and is charged per unit
          over a set of bill months.
        </li>
      </ul>
      <p>Adjustments can be positive or negative and do not apply to lifeline consumers.</p>

      <h2>Taxes and other items</h2>
      <p>
        Bills also include taxes and duties, such as General Sales Tax and electricity duty, which depend on your province
        and tax status. Your bill may also show arrears or corrections from earlier months. The total payable and due date
        are on your official bill.
      </p>

      <h2>Where these rules come from</h2>
      <p>
        {f.schedule && f.reference
          ? `The current residential and commercial rates were notified in ${f.reference}, in force from ${formatDate(f.schedule.effectiveFrom)}. `
          : ""}
        See the <Link href={routes.methodology}>methodology</Link> and <Link href={routes.sources}>sources</Link> for the
        documents behind each figure.
      </p>

      <div className="mt-10!">
        <OtherBillChecks />
      </div>
    </ProsePage>
  );
}
