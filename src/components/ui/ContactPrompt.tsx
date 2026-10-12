import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

/**
 * An invitation to get in touch that is only made when a contact address is
 * configured (NEXT_PUBLIC_CONTACT_EMAIL). Without one, the page says so
 * instead of implying a channel that does not exist.
 *
 * `children` is the start of the sentence that ends with "contact page.",
 * e.g. "For questions about this policy, use the".
 */
export function ContactPrompt({ children }: { children: ReactNode }) {
  if (siteConfig.contactEmail) {
    return (
      <p>
        {children} <Link href={routes.contact}>contact page</Link>.
      </p>
    );
  }
  return (
    <p>
      No contact address has been published yet. When one is, it will be listed on the{" "}
      <Link href={routes.contact}>contact page</Link>.
    </p>
  );
}
