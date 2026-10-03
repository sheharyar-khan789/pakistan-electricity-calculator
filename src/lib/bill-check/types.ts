import type { ProviderId } from "@/data/providers";

/**
 * Bill-check domain types.
 *
 * Flow: provider → identifier type → validation → lookup adapter →
 * official destination. This site never retrieves bills itself: official
 * systems require the user to submit their identifier on the official page
 * (anti-forgery tokens, and CAPTCHA for K-Electric).
 */

export type IdentifierType = "reference-number" | "customer-id" | "account-number";

export type IdentifierRule = {
  type: IdentifierType;
  /** Label exactly as the official form uses it, e.g. "Reference No". */
  officialLabel: string;
  /** Label shown on this site. */
  label: string;
  /** Exact number of digits required by the official form. */
  digits: number;
  /** Optional trailing letters printed after the digits (e.g. U / R). */
  suffixes?: readonly string[];
  /** Where the identifier appears, as stated by an official source. */
  whereToFind?: string;
  /** Plain-language note, e.g. how the suffix is chosen on the official page. */
  note?: string;
};

/**
 * How the official lookup works. Both current methods require the user to
 * submit on the official page; neither accepts a pre-filled link.
 */
export type LookupMethod =
  | "pitc-web-bill" // bill.pitc.com.pk form (ASP.NET post with anti-forgery token)
  | "ke-duplicate-bill"; // ke.com.pk Digital Bills & Payments (form with CAPTCHA)

export type VerificationSource = {
  label: string;
  url: string;
};

export type BillCheckStatus = "supported" | "verification-pending";

export type BillCheckProvider = {
  providerId: ProviderId;
  /** URL path segment, e.g. "iesco-bill-check". */
  slug: string;
  status: BillCheckStatus;
  lookup: {
    method: LookupMethod;
    /** Official page the user is sent to. */
    url: string;
    /** Organisation operating the lookup, e.g. "PITC". */
    operator: string;
    /** True when the official page shows a CAPTCHA the user must complete. */
    captcha: boolean;
  };
  identifiers: readonly IdentifierRule[];
  verification: {
    /** ISO date the destination and identifier rules were checked. */
    verifiedOn: string;
    /** What was checked, in plain words. */
    method: string;
    sources: readonly VerificationSource[];
  };
  /** Provider-specific notes shown on its page (verified facts only). */
  notes: readonly string[];
};

/* ------------------------------------------------------------------ */

export type IdentifierErrorCode =
  | "empty"
  | "invalid-characters"
  | "wrong-length"
  | "invalid-suffix"
  | "unsupported-identifier"
  | "unknown-provider"
  | "provider-unavailable";

export type NormalizedIdentifier = {
  type: IdentifierType;
  /** Digits only, as entered on the official form. */
  digits: string;
  /** Suffix letter if the user typed one (e.g. "U"). */
  suffix: string | null;
};

export type IdentifierValidation =
  | { ok: true; value: NormalizedIdentifier }
  | { ok: false; code: IdentifierErrorCode; message: string };

export type LookupStep = string;

export type PreparedLookup = {
  providerId: ProviderId;
  identifier: NormalizedIdentifier;
  /** Official URL to open in a new tab. */
  destinationUrl: string;
  destinationHost: string;
  operator: string;
  /** Text to copy for pasting into the official form. */
  copyValue: string;
  /** Steps to finish on the official page. */
  steps: readonly LookupStep[];
};

export type LookupResult =
  | { ok: true; lookup: PreparedLookup }
  | { ok: false; code: IdentifierErrorCode; message: string };
