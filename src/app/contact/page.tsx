import Link from "next/link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/ui/ProsePage";
import { Alert } from "@/components/ui/Alert";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact the Pakistan Electricity & Utility Calculator team about corrections, feedback or questions about the website.",
  path: routes.contact,
});

export default function ContactPage() {
  const email = siteConfig.contactEmail;

  return (
    <ProsePage
      title="Contact"
      path={routes.contact}
      lead="Questions, feedback or a correction to report? Here is how to reach us."
    >
      <Alert tone="warning" title="We are not your electricity provider">
        We cannot help with your actual bill, payments, load-shedding, complaints or new connections.
        Please contact your electricity provider for those. Their websites are listed on the{" "}
        <Link href={routes.sources}>sources page</Link>.
      </Alert>

      <h2>Get in touch</h2>
      {email ? (
        <p>
          Email us at <a href={`mailto:${email}`}>{email}</a>. We read every message but cannot
          promise a reply to all of them.
        </p>
      ) : (
        <p>
          No contact address has been published for this website yet, so we cannot receive messages at the moment.
          For anything about your bill, account or supply, please contact your electricity provider directly.
        </p>
      )}

      <h2>Reporting a correction</h2>
      <p>If you think a tariff, calculation or piece of information is wrong, please include:</p>
      <ul>
        <li>the page or calculator involved;</li>
        <li>what you think is incorrect; and</li>
        <li>a link to the official document that shows the correct information, if you have one.</li>
      </ul>
      <p>
        Please do not send your bill reference number, CNIC or other personal details. We do not need
        them.
      </p>
    </ProsePage>
  );
}
