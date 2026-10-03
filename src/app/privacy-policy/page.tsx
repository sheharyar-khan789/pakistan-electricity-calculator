import Link from "next/link";
import { LEGAL_LAST_UPDATED } from "@/config/legal";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/ui/ProsePage";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How the Pakistan Electricity & Utility Calculator handles information: calculator inputs stay in your browser and no account is needed.",
  path: routes.privacyPolicy,
});

/*
 * Keep this policy in step with what the site actually does. Before adding
 * analytics, advertising (e.g. AdSense), forms or any server-side processing
 * of calculator inputs, update the relevant sections and LEGAL_LAST_UPDATED.
 */
export default function PrivacyPolicyPage() {
  return (
    <ProsePage
      title="Privacy Policy"
      path={routes.privacyPolicy}
      lastUpdated={LEGAL_LAST_UPDATED}
      lead="This policy explains what information this website handles and how."
    >
      <h2>Summary</h2>
      <ul>
        <li>You do not need an account to use this website.</li>
        <li>Numbers you enter into the calculators are processed in your browser and are not sent to us.</li>
        <li>
          Reference numbers, Customer IDs and account numbers you enter in the bill checker are checked in your browser,
          are never sent to or stored by us, and are never put in a link.
        </li>
        <li>This website does not use analytics, advertising, tracking cookies or browser storage.</li>
      </ul>

      <h2>Information you enter into calculators</h2>
      <p>
        The calculators ask for details such as your electricity provider, consumer type, bill month, units consumed,
        meter readings, sanctioned load, peak and off-peak units, maximum demand (MDI), appliance names and wattages, hours
        of use and a rate per unit. These values are processed in your browser to produce results. They are not sent to
        our servers, are not stored by us or in your browser, and are cleared when you leave or reload the page. The
        calculators never ask for your name, bill reference number, CNIC or account details.
      </p>

      <h2>Bill checker</h2>
      <p>
        When you check a bill, the number you enter is checked for the right format in your browser. If you choose to
        open the official bill page, the number is copied to your device’s clipboard so you can paste it there. We do
        not receive, store or log the number, and we do not add it to the link we open. Your bill is shown by your
        electricity provider’s official website (for example bill.pitc.com.pk or ke.com.pk), whose own privacy policy
        applies.
      </p>

      <h2>Information collected automatically</h2>
      <p>
        Like most websites, our hosting provider may automatically process technical information
        when you visit, such as your IP address, browser type, the pages you request and the time of
        your request. This is used to deliver the website, keep it secure and diagnose problems. We
        do not use it to identify you.
      </p>

      <h2>Cookies and storage</h2>
      <p>
        This website does not set cookies and does not use your browser’s local storage. Your browser may keep its usual
        cache of the website’s files (pages, scripts, fonts and images) so it loads faster; these do not identify you.
        Fonts are served from this website, not from a third-party font service.
      </p>

      <h2>Analytics</h2>
      <p>
        No analytics service is connected, so no usage information is sent anywhere. The website’s code includes a
        built-in way to count anonymous events in future, such as which calculator was used and whether a calculation
        completed. Those events are designed so they cannot contain the numbers you type: no reference number, Customer
        ID, account number, bill amount, units, readings or other personal information. Before any analytics service is
        connected, this policy will be updated to name it and describe what it collects.
      </p>

      <h2>Advertising</h2>
      <p>
        This website does not show advertising. If advertising is introduced in future, this policy will be updated
        before it is enabled to describe the services used, the information they collect and the choices available to
        you, including consent where required.
      </p>

      <h2>Links to other websites</h2>
      <p>
        This website links to official websites such as NEPRA and electricity providers. Those
        websites have their own privacy policies, and we are not responsible for how they handle
        information.
      </p>

      <h2>Children</h2>
      <p>This website is intended for a general audience and does not knowingly collect information from children.</p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy as the website changes. The date at the top of this page shows when
        it was last revised.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about this policy, use the <Link href={routes.contact}>contact page</Link> of{" "}
        {siteConfig.name}.
      </p>
    </ProsePage>
  );
}
