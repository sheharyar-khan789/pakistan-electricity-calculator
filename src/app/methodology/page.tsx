import Link from "next/link";
import { routes } from "@/config/routes";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/ui/ProsePage";
import { Alert } from "@/components/ui/Alert";
import { getDefaultBillingMonth } from "@/lib/calculator/engine-registry";
import { formatDate } from "@/lib/format";
import { getSharedSchedule, getSources } from "@/lib/tariffs/overview";

export const metadata = buildMetadata({
  title: "Methodology",
  description:
    "How bill checking works, how estimates are calculated from official tariffs, what is included and excluded, and how the two differ from your official bill.",
  path: routes.methodology,
});

/** Figures quoted in the prose come from the verified tariff data, never typed here. */
function tariffFacts() {
  const month = getDefaultBillingMonth();
  const schedule = month ? getSharedSchedule(month) : null;
  if (!schedule) return null;
  const residential = schedule.categories.find((c) => c.categoryId === "residential");
  const commercial = schedule.categories.find((c) => c.categoryId === "commercial");
  const lifeline = residential?.bands.find((b) => b.id === "lifeline");
  const commercialBand = commercial?.bands[0];
  return {
    effectiveFrom: formatDate(schedule.effectiveFrom),
    reference: getSources(schedule.sourceIds)[0]?.reference ?? "",
    loadLimitKw: residential?.sanctionedLoadBelowKw,
    lifelineMinimum: lifeline?.minimumCharge?.singlePhasePerMonth,
    commercialFixed:
      commercialBand?.fixedCharge.kind === "per-consumer" ? commercialBand.fixedCharge.amountPerMonth : undefined,
  };
}

export default function MethodologyPage() {
  const facts = tariffFacts();
  return (
    <ProsePage
      title="Methodology"
      path={routes.methodology}
      lead="How electricity bill estimates on this website are produced, checked and kept up to date."
    >
      {facts ? (
        <Alert tone="info" title="Current coverage">
          Estimates use the tariff in force from {facts.effectiveFrom} ({facts.reference}) for residential
          and commercial connections below {facts.loadLimitKw} kW, for all twelve providers, and the
          time-of-use tariffs (A-1(b) and A-2(c)) for connections of {facts.loadLimitKw} kW and above in the{" "}
          <Link href={routes.touCalculator}>TOU bill calculator</Link>. Estimates are before taxes.
        </Alert>
      ) : null}

      <h2>Bill check and bill estimate are different</h2>
      <ul>
        <li>
          <strong>Bill check</strong> shows your <em>actual</em> bill. We check that your reference number, Customer ID or
          K-Electric account number has the right format for your provider, then open your provider’s official bill page
          (bill.pitc.com.pk for ex-WAPDA companies, ke.com.pk for K-Electric). The bill is shown by the provider, not by
          this website, and the amount on it is what you pay.
        </li>
        <li>
          <strong>Bill estimate</strong> (the calculator) works out a likely amount from official tariff rates and your
          units. It is for planning and understanding, is calculated before taxes, and is never an official bill.
        </li>
      </ul>
      <p>
        Bill-check rules (identifier types, digit counts, destinations) are read from each official page and recorded with
        the date checked. See the <Link href={routes.sources}>sources page</Link> for every page and its check date.
      </p>

      <h2>How the calculator applies the tariff</h2>
      <p>These rules come from the notified schedule of tariffs and NEPRA’s decisions:</p>
      <ul>
        <li>
          <strong>Un-protected residential:</strong> every unit is charged at the rate of the slab your
          total consumption falls in. There is no slab benefit.
        </li>
        <li>
          <strong>Protected residential</strong> : units up to the previous slab’s limit are charged at
          the previous slab’s rate and only the remainder at the current slab’s rate (“benefit of one
          previous slab”).
        </li>
        <li>
          <strong>Lifeline:</strong> no slab benefit and no
          fixed charges; a minimum monthly charge
          {facts?.lifelineMinimum !== undefined ? ` of Rs. ${facts.lifelineMinimum}` : ""} applies.
        </li>
        <li>
          <strong>Fixed charges:</strong> for residential consumers, the per-kW rate for the slab your
          consumption falls in, multiplied by your sanctioned load. Commercial connections below{" "}
          {facts?.loadLimitKw} kW pay a fixed charge per connection
          {facts?.commercialFixed !== undefined ? ` of Rs. ${facts.commercialFixed.toLocaleString("en-PK")}` : ""} per month.
        </li>
        <li>
          <strong>Adjustments:</strong> the fuel charges adjustment (FCA) and quarterly tariff
          adjustment (QTA) notified for your bill month are added per unit. Neither applies to lifeline
          consumers. NEPRA charges the FCA on units billed two months earlier; the estimate applies it
          to the units you enter. An adjustment not yet notified is listed as pending rather than
          guessed.
        </li>
        <li>
          <strong>Rounding:</strong> every intermediate amount is exact. Each charge is rounded once to
          the nearest paisa, the total is the sum of those charges, and the headline figure is shown to
          the nearest rupee.
        </li>
      </ul>
      <p>
        Two points are our interpretation where the schedule is not explicit: fixed charges at 0 units
        use the first slab’s rate, and the lifeline minimum charge is applied as a floor on electricity
        charges. Every estimate lists the assumptions it relied on.
      </p>

      <h2>1. From your inputs to an estimate</h2>
      <ol>
        <li>
          <strong>Provider.</strong> You select the company that issues your bill. Each provider has
          its own tariff data.
        </li>
        <li>
          <strong>Consumer category.</strong> You choose your consumer type, such as residential or
          commercial. Where a tariff depends on further options, the calculator asks for them only
          once those options have been verified.
        </li>
        <li>
          <strong>Units.</strong> You enter the units consumed in the billing month, or your previous
          and current meter readings. Units from readings are worked out as current reading minus
          previous reading.
        </li>
        <li>
          <strong>Calculation.</strong> The calculation engine for that provider applies the tariff
          for your category, including any unit slabs, and then the applicable adjustments, taxes and
          other charges.
        </li>
        <li>
          <strong>Result.</strong> You see the estimated total, a line-by-line breakdown, the
          effective cost per unit and the tariff version used.
        </li>
      </ol>

      <h2>2. Where tariff data comes from</h2>
      <p>
        Tariff rates and related charges are taken only from official publications, such as tariff
        determinations and decisions published by the National Electric Power Regulatory Authority
        (NEPRA) and notifications from the Government of Pakistan. The{" "}
        <Link href={routes.sources}>sources page</Link> lists the organisations we rely on. Each
        tariff record links to the specific documents it is based on.
      </p>

      <h2>3. Versioning and verification</h2>
      <p>Every set of tariff data used by a calculator is stored as a version with:</p>
      <ul>
        <li>the provider and consumer category it applies to;</li>
        <li>the date it takes effect and, where known, the date it ends;</li>
        <li>links to the official source documents; and</li>
        <li>the date it was last checked against those sources.</li>
      </ul>
      <p>
        These details are shown with every estimate so you can judge how current it is. When an
        official change is published, the data is updated as a new version rather than overwriting
        the old one.
      </p>

      <h2>4. What a bill typically contains</h2>
      <p>
        Electricity bills in Pakistan usually combine several parts. Depending on the tariff, a bill
        may include:
      </p>
      <ul>
        <li>charges for the units consumed, sometimes calculated in slabs;</li>
        <li>fixed charges for certain consumer categories;</li>
        <li>adjustments notified for particular periods, such as fuel price adjustments;</li>
        <li>government taxes and duties; and</li>
        <li>other levies or fees that appear on the bill.</li>
      </ul>
      <p>
        Estimates include only the parts that can be calculated from verified tariff data and your
        inputs. Each estimate lists which parts it includes.
      </p>

      <h2>5. What estimates do not include</h2>
      <p>An estimate cannot know about items specific to your account, such as:</p>
      <ul>
        <li>arrears or unpaid amounts from previous bills;</li>
        <li>late payment surcharges;</li>
        <li>instalments, deferrals or billing corrections;</li>
        <li>the exact length of your billing cycle; and</li>
        <li>taxes that depend on your individual circumstances.</li>
      </ul>
      <p>
        Because of this, your actual bill can differ from the estimate. The bill issued by your
        provider is always the amount you need to pay. See the{" "}
        <Link href={routes.disclaimer}>disclaimer</Link>.
      </p>

      <h2>6. Corrections</h2>
      <p>
        If you think an estimate or a tariff record is wrong, please let us know through the{" "}
        <Link href={routes.contact}>contact page</Link>, ideally with a link to the official document
        involved. Confirmed corrections are published as a new tariff version.
      </p>
    </ProsePage>
  );
}
