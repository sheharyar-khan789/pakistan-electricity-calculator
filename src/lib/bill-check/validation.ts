import type { IdentifierRule, IdentifierValidation } from "./types";

/** Separators people type or paste: spaces (incl. non-breaking), dashes, dots, slashes. */
const SEPARATORS = /[\s   \-‐-―./]/g;
/** Characters that may appear after cleaning: digits and letters (for U/R). */
const ALLOWED = /^[0-9A-Za-z]*$/;

/**
 * Validates an identifier against a provider's rule. Pure: no storage, no
 * network, no logging.
 *
 * Accepts pasted formats such as "08 11131 1234567 U" or "0811131-1234567R".
 */
export function validateIdentifier(raw: string, rule: IdentifierRule): IdentifierValidation {
  const label = rule.label;
  const cleaned = raw.normalize("NFKC").replace(SEPARATORS, "");

  if (cleaned === "") {
    return { ok: false, code: "empty", message: `Please enter your ${label}.` };
  }
  if (!ALLOWED.test(cleaned)) {
    return {
      ok: false,
      code: "invalid-characters",
      message: `${label} should contain numbers only. Remove any other symbols.`,
    };
  }

  let digits = cleaned;
  let suffix: string | null = null;
  const last = cleaned.at(-1)!.toUpperCase();
  if (/[A-Z]/.test(last)) {
    if (!rule.suffixes?.includes(last) || /[A-Za-z]/.test(cleaned.slice(0, -1))) {
      return {
        ok: false,
        code: rule.suffixes ? "invalid-suffix" : "invalid-characters",
        message: rule.suffixes
          ? `${label} format does not look valid. It should be ${rule.digits} digits, optionally followed by ${rule.suffixes.join(" or ")}.`
          : `${label} should contain numbers only.`,
      };
    }
    digits = cleaned.slice(0, -1);
    suffix = last;
  }

  if (!/^\d+$/.test(digits)) {
    return { ok: false, code: "invalid-characters", message: `${label} should contain numbers only.` };
  }
  if (digits.length !== rule.digits) {
    return {
      ok: false,
      code: "wrong-length",
      message: `${label} format does not look valid. It should have exactly ${rule.digits} digits (you entered ${digits.length}).`,
    };
  }

  return { ok: true, value: { type: rule.type, digits, suffix } };
}
