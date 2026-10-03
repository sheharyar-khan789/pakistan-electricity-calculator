import Link from "next/link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/ui/ProsePage";

export const metadata = buildMetadata({
  title: "About",
  description:
    "An independent website that takes you to your electricity provider’s official bill page and estimates bills from official tariffs. Not affiliated with any provider.",
  path: routes.about,
});

export default function AboutPage() {
  return (
    <ProsePage
      title="About"
      path={routes.about}
      lead="An independent website that helps people in Pakistan estimate and understand their electricity bills."
    >
      <h2>What this website is</h2>
      <p>
        {siteConfig.name} is a free, independent website. It helps you check your electricity bill
        online by taking you to your provider’s official bill page, and it offers calculators that
        estimate bills, along with plain-language explanations of how a bill is put together.
      </p>

      <h2>What this website is not</h2>
      <p>
        This website is <strong>not</strong> operated by, affiliated with or endorsed by NEPRA, PITC,
        any electricity distribution company (including LESCO, IESCO, MEPCO, FESCO, GEPCO, PESCO,
        HESCO, SEPCO, QESCO, TESCO, HAZECO and K-Electric) or any government body. It does not
        retrieve, store, change or take payment for your bill: your bill is shown only on your
        provider’s official website. For complaints or connection requests, contact your electricity
        provider directly.
      </p>

      <h2>The problem we solve</h2>
      <p>
        Each electricity company has its own bill page and its own number format. Finding the right official page and
        knowing whether to enter a reference number, a Customer ID or an account number is confusing. We check your number
        against the rules of your provider’s official page and take you straight there.
      </p>

      <h2>Our approach</h2>
      <ul>
        <li>
          <strong>Official destinations only.</strong> The bill checker only sends you to official bill pages we have
          checked, such as bill.pitc.com.pk and ke.com.pk. Your bill is shown there, not here, and we do not keep your
          number.
        </li>
        <li>
          <strong>Official sources.</strong> Tariff figures are taken from documents published by
          official bodies. The <Link href={routes.sources}>sources page</Link> lists them.
        </li>
        <li>
          <strong>No guessing.</strong> A provider’s calculator shows figures only after its tariff
          data has been verified. Until then it says so plainly.
        </li>
        <li>
          <strong>Transparent results.</strong> Estimates show a breakdown, the tariff version used
          and when the data was last checked. The{" "}
          <Link href={routes.methodology}>methodology</Link> explains how it works.
        </li>
        <li>
          <strong>Privacy first.</strong> The calculator does not ask for your name, reference number
          or account details. See the <Link href={routes.privacyPolicy}>privacy policy</Link>.
        </li>
      </ul>

      <h2>Current status</h2>
      <p>
        Bill estimates are available for all twelve providers listed on this website, for residential
        and commercial connections: slab tariffs below 5 kW, and time-of-use tariffs at 5 kW and above.
        Estimates are calculated before taxes. Industrial, agricultural and prepaid connections are not
        supported yet, and each calculator says so when it cannot give an estimate.
      </p>

      <h2>Corrections and feedback</h2>
      <p>
        If you believe something on this website is wrong or out of date, please tell us through the{" "}
        <Link href={routes.contact}>contact page</Link>.
      </p>
    </ProsePage>
  );
}
