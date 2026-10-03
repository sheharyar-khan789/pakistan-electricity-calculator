import Link from "next/link";
import { LEGAL_LAST_UPDATED } from "@/config/legal";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/ui/ProsePage";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description: "The terms that apply when you use the Pakistan Electricity & Utility Calculator website.",
  path: routes.terms,
});

export default function TermsPage() {
  return (
    <ProsePage
      title="Terms of Use"
      path={routes.terms}
      lastUpdated={LEGAL_LAST_UPDATED}
      lead={`By using ${siteConfig.name}, you agree to these terms.`}
    >
      <h2>1. About this website</h2>
      <p>
        {siteConfig.name} is an independent website. It helps you reach your electricity provider’s official bill
        page, and provides calculators and information to help estimate electricity costs in Pakistan. It is not
        affiliated with NEPRA, any electricity distribution company or any government body.
      </p>

      <h2>2. Bill checker</h2>
      <p>
        The bill checker only checks that the number you enter has the right format for your provider, then opens the
        provider’s own official bill page. This website does not retrieve, display, store or pay bills. Your bill, its
        amount and any payment are provided by your electricity provider on its own website, under its own terms.
      </p>

      <h2>3. Estimates only</h2>
      <p>
        All results are estimates for general information. They are not bills, quotations or official
        statements, and they may differ from the amount charged by your electricity provider. You
        should not rely on them as the sole basis for financial or other decisions. Please read the{" "}
        <Link href={routes.disclaimer}>disclaimer</Link>.
      </p>

      <h2>4. Accuracy and availability</h2>
      <p>
        We aim to keep tariff data accurate and up to date using official sources, but we do not
        guarantee that any information or result is complete, accurate or current. Calculators and
        pages may change, be unavailable or be withdrawn at any time.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the website in a way that breaks any applicable law;</li>
        <li>attempt to disrupt, overload or gain unauthorised access to the website or its systems;</li>
        <li>use automated means to copy large parts of the website in a way that harms its operation; or</li>
        <li>present results from this website as official bills or official statements.</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        The design, text and code of this website belong to its operator unless stated otherwise.
        Official documents and names of organisations referred to on this website belong to their
        respective owners and are used only for identification and reference.
      </p>

      <h2>7. External links</h2>
      <p>
        Links to other websites are provided for convenience. We are not responsible for their
        content, availability or policies.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the extent permitted by law, the website and its operator are not liable for any loss or
        damage arising from use of, or reliance on, the website or its results.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The date at the top of this page shows when they
        were last revised. Continued use of the website means you accept the updated terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms can be sent through the <Link href={routes.contact}>contact page</Link>.
      </p>
    </ProsePage>
  );
}
