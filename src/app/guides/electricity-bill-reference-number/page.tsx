import Link from "next/link";
import { routes } from "@/config/routes";
import { getGuide } from "@/data/guides";
import { getProvider } from "@/data/providers";
import { listBillCheckProviders } from "@/lib/bill-check/registry";
import { buildMetadata } from "@/lib/seo/metadata";
import { IdentifierTable, OtherBillChecks } from "@/components/bill-check/BillCheckSections";
import { ProsePage } from "@/components/ui/ProsePage";

const guide = getGuide("electricity-bill-reference-number");

export const metadata = buildMetadata({
  title: guide.title,
  description: guide.description,
  path: routes.referenceNumberGuide,
});

export default function ReferenceNumberGuide() {
  const configs = listBillCheckProviders().flatMap((p) => (p.config ? [p.config] : []));
  const pitc = configs.filter((c) => c.lookup.method === "pitc-web-bill");
  const pitcNames = pitc.map((c) => getProvider(c.providerId).shortName);
  const ref = pitc[0]?.identifiers.find((r) => r.type === "reference-number");
  // Group companies by Customer ID length, e.g. "11 digits for LESCO; 10 digits for IESCO, …".
  const byDigits = new Map<number, string[]>();
  for (const c of pitc) {
    const d = c.identifiers.find((r) => r.type === "customer-id")?.digits;
    if (d) byDigits.set(d, [...(byDigits.get(d) ?? []), getProvider(c.providerId).shortName]);
  }
  const customerText = [...byDigits.entries()]
    .sort((a, b) => a[1].length - b[1].length)
    .map(([d, names]) => `${d} digits for ${names.join(", ")}`)
    .join("; ");
  const ke = configs.find((c) => c.providerId === "ke");
  const keAccount = ke?.identifiers.find((r) => r.type === "account-number");

  return (
    <ProsePage
      title={guide.title}
      path={routes.referenceNumberGuide}
      parent={{ name: "Guides", path: routes.guides }}
      lastUpdated={guide.reviewedOn}
      lead="The number you need depends on your electricity provider. Here is what each official bill page accepts."
    >
      <h2>Ex-WAPDA distribution companies</h2>
      <p>
        {pitcNames.join(", ")} bills can be viewed on the official PITC Web Bill pages (bill.pitc.com.pk). Each page
        lets you search in two ways:
      </p>
      <ul>
        {ref ? (
          <li>
            <strong>Reference Number</strong>: {ref.digits} digits. On your bill it is followed by a letter,{" "}
            {ref.suffixes?.join(" or ")}. On the official page you type the {ref.digits} digits and pick the letter from a
            small list next to the box.
          </li>
        ) : null}
        <li>
          <strong>Customer ID</strong>: {customerText}.
        </li>
      </ul>
      {byDigits.size > 1 ? (
        <p>Customer ID lengths differ between companies, so choose the right provider before entering yours.</p>
      ) : null}

      {ke && keAccount ? (
        <>
          <h2>K-Electric</h2>
          <p>
            K-Electric uses a <strong>{keAccount.digits}-digit Account Number</strong>. {keAccount.whereToFind} K-Electric’s
            Duplicate Bill form also has an optional Consumer Number field and asks you to type a CAPTCHA code.
          </p>
        </>
      ) : null}

      <h2>At a glance</h2>
      <p>Each row reflects the provider’s official bill page on the date shown.</p>
      <div className="mt-4!">
        <IdentifierTable />
      </div>

      <h2>Tips for entering your number</h2>
      <ul>
        <li>Copy the number exactly as printed. Spaces and dashes don’t matter in our checker; it removes them.</li>
        <li>Choose your provider first, because the number of digits differs between providers.</li>
        <li>
          If you can’t find your number or have lost your bill, contact your electricity provider. Their official websites
          are listed on the <Link href={routes.sources}>sources page</Link>.
        </li>
      </ul>

      <h2>Check your bill</h2>
      <p>
        Ready? Use the <Link href={routes.billCheck}>electricity bill check</Link>, or go straight to your provider below.
      </p>
      <div className="mt-6!">
        <OtherBillChecks />
      </div>
    </ProsePage>
  );
}
