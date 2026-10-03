import Link from "next/link";
import { LEGAL_LAST_UPDATED } from "@/config/legal";
import { routes } from "@/config/routes";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/ui/ProsePage";
import { Alert } from "@/components/ui/Alert";

export const metadata = buildMetadata({
  title: "Disclaimer",
  description:
    "Results on this website are estimates, not official electricity bills. This website is independent and not affiliated with NEPRA or any electricity provider.",
  path: routes.disclaimer,
});

export default function DisclaimerPage() {
  return (
    <ProsePage
      title="Disclaimer"
      path={routes.disclaimer}
      lastUpdated={LEGAL_LAST_UPDATED}
      lead="Please read this before relying on any result from this website."
    >
      <Alert tone="warning" title="Estimates, not official bills">
        The amount you must pay is always the amount on the bill issued by your electricity provider.
      </Alert>

      <h2>Estimates only</h2>
      <p>
        Calculators on this website produce estimates based on the information you enter and on
        tariff data taken from official sources. An estimate is not an electricity bill, a quotation
        or an official statement of charges.
      </p>

      <h2>No affiliation</h2>
      <p>
        This is an independent website. It is not operated by, affiliated with or endorsed by the
        National Electric Power Regulatory Authority (NEPRA), the Ministry of Energy (Power Division),
        any electricity distribution company — including LESCO, IESCO, MEPCO, FESCO, GEPCO, PESCO,
        HESCO, SEPCO, QESCO, TESCO and K-Electric — or any other government body. Names of these
        organisations are used only to identify them.
      </p>

      <h2>Why your bill may differ</h2>
      <ul>
        <li>Tariffs, adjustments and taxes can change, and changes may apply before our data is updated.</li>
        <li>Your bill may include arrears, late payment surcharges, instalments or corrections.</li>
        <li>Your billing period may be longer or shorter than a typical month.</li>
        <li>Some charges and taxes depend on your connection or personal circumstances.</li>
        <li>Your meter reading may differ from the units you entered.</li>
      </ul>

      <h2>No professional advice</h2>
      <p>
        Information on this website is general and is not financial, legal or professional advice.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        While we work to keep information accurate, we make no guarantee that it is complete, correct
        or current, and we accept no liability for decisions made using it. See the{" "}
        <Link href={routes.terms}>terms of use</Link> and the <Link href={routes.methodology}>methodology</Link>.
      </p>
    </ProsePage>
  );
}
