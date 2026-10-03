import type { ProviderId } from "@/data/providers";
import type { BillCheckProvider, IdentifierRule } from "./types";

/**
 * Official bill-lookup configuration per provider.
 *
 * Verified on 2026-10-01 by loading each official page and reading its form
 * (field labels, maxlength, placeholder text, CAPTCHA). Customer ID rules
 * were read after selecting "Customer ID" on each PITC page, which reloads
 * the form; no identifier was ever submitted. See docs/BILL-CHECK.md.
 */
const VERIFIED_ON = "2026-10-01";
const PITC = "https://bill.pitc.com.pk";

/** Reference No on PITC pages: 14 digits; the U/R code is chosen in a separate list. */
const pitcReference: IdentifierRule = {
  type: "reference-number",
  officialLabel: "Reference No",
  label: "Reference Number",
  digits: 14,
  suffixes: ["U", "R"],
  note: "The official page asks for the 14 digits and, separately, the U or R letter that follows them on your bill.",
};

const pitcCustomerId = (digits: number): IdentifierRule => ({
  type: "customer-id",
  officialLabel: "Customer ID",
  label: "Customer ID",
  digits,
});

function pitc(
  providerId: ProviderId,
  code: string,
  customerIdDigits: number,
  sources: BillCheckProvider["verification"]["sources"],
  notes: readonly string[],
): BillCheckProvider {
  const url = `${PITC}/${code}bill`;
  return {
    providerId,
    slug: `${providerId}-bill-check`,
    status: "supported",
    lookup: { method: "pitc-web-bill", url, operator: "PITC (Power Information Technology Company)", captcha: false },
    identifiers: [pitcReference, pitcCustomerId(customerIdDigits)],
    verification: {
      verifiedOn: VERIFIED_ON,
      method: `Loaded ${url} and read the form: “Reference No” (14 digits, with a U/R list) and “Customer ID” (${customerIdDigits} digits). No CAPTCHA was shown.`,
      sources: [{ label: `${code.toUpperCase()} Web Bill (PITC)`, url }, ...sources],
    },
    notes,
  };
}

export const billCheckProviders: readonly BillCheckProvider[] = [
  pitc(
    "lesco",
    "lesco",
    11,
    [{ label: "LESCO website (links its own Customer Bill service)", url: "https://www.lesco.gov.pk/" }],
    [
      "LESCO Customer IDs are 11 digits on the official page; most other PITC companies use 10.",
      "LESCO’s own website also links to a separate LESCO Customer Bill service at bill.lesco.gov.pk.",
    ],
  ),
  pitc("iesco", "iesco", 10, [{ label: "IESCO website (links to this page)", url: "https://www.iesco.com.pk/" }], []),
  pitc("mepco", "mepco", 10, [{ label: "MEPCO website (links to this page)", url: "https://mepco.com.pk/" }], []),
  pitc("fesco", "fesco", 10, [{ label: "FESCO website (links to this page)", url: "https://www.fesco.com.pk/" }], []),
  pitc(
    "gepco",
    "gepco",
    10,
    [{ label: "GEPCO Duplicate Bill page (opens this page)", url: "https://www.gepco.com.pk/GEPCOBill.aspx" }],
    ["GEPCO’s own Duplicate Bill page checks for a 14-digit reference number and then opens this PITC page."],
  ),
  pitc(
    "pesco",
    "pesco",
    10,
    [],
    ["PESCO’s own website could not be reached during verification, so the PITC page was verified directly."],
  ),
  pitc("hesco", "hesco", 10, [{ label: "HESCO website (links to this page)", url: "https://hesco.gov.pk/" }], []),
  pitc(
    "sepco",
    "sepco",
    10,
    [{ label: "SEPCO website (links to PITC Web Bill)", url: "http://www.sepco.com.pk/" }],
    [],
  ),
  pitc("qesco", "qesco", 10, [{ label: "QESCO website (links to this page)", url: "http://www.qesco.com.pk/" }], []),
  pitc("tesco", "tesco", 10, [{ label: "TESCO website (links to this page)", url: "https://tesco.gov.pk/" }], []),
  pitc(
    "hazeco",
    "hazeco",
    10,
    [{ label: "PITC Web Bill home (lists HAZECO)", url: `${PITC}/` }],
    ["HAZECO’s own website has not been verified yet; the PITC page was verified directly."],
  ),
  {
    providerId: "ke",
    slug: "ke-bill-check",
    status: "supported",
    lookup: {
      method: "ke-duplicate-bill",
      url: "https://ke.com.pk/bills-e-payments/",
      operator: "K-Electric",
      captcha: true,
    },
    identifiers: [
      {
        type: "account-number",
        officialLabel: "Account Number",
        label: "Account Number",
        digits: 13,
        whereToFind: "K-Electric says the 13-digit Account Number is written on the top right of the KE bill.",
      },
    ],
    verification: {
      verifiedOn: VERIFIED_ON,
      method:
        "Loaded ke.com.pk/bills-e-payments and its embedded Duplicate Bill form: “Account Number *” (13 digits), optional “Consumer Number” (8 digits), and a case-sensitive CAPTCHA.",
      sources: [{ label: "K-Electric Digital Bills & Payments", url: "https://ke.com.pk/bills-e-payments/" }],
    },
    notes: [
      "K-Electric’s page asks you to type a CAPTCHA before showing your bill.",
      "K-Electric says you can pay at bank branches or ATMs using your 13-digit KE account number.",
    ],
  },
];
