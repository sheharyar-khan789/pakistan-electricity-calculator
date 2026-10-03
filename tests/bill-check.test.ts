import { describe, it } from "node:test";
import { each, eachValue, expect } from "./support/expect";
import { PROVIDER_IDS } from "@/data/providers";
import { billCheckProviders } from "@/lib/bill-check/providers";
import {
  findBillCheckBySlug,
  getBillCheck,
  OFFICIAL_LOOKUP_HOSTS,
  prepareBillLookup,
  validateBillCheckConfig,
} from "@/lib/bill-check/registry";
import type { BillCheckProvider, IdentifierRule } from "@/lib/bill-check/types";
import { validateIdentifier } from "@/lib/bill-check/validation";

/**
 * Identifier rules below were read from the official forms on 2026-10-01:
 * PITC Reference No 14 digits (+ U/R list), Customer ID 10 digits (LESCO 11);
 * K-Electric Account Number 13 digits.
 */
const REF14 = "08111311234567"; // shape only — not a real account
const clone = () => structuredClone(billCheckProviders) as unknown as BillCheckProvider[];

describe("provider registry", () => {
  it("configuration passes validation", () => {
    expect(validateBillCheckConfig(billCheckProviders)).toEqual([]);
  });

  it("covers every provider exactly once with unique slugs", () => {
    expect(billCheckProviders.map((c) => c.providerId).sort()).toEqual([...PROVIDER_IDS].sort());
    expect(new Set(billCheckProviders.map((c) => c.slug)).size).toBe(billCheckProviders.length);
  });

  eachValue(billCheckProviders.map((c) => c.providerId))("%s points to a verified official https host", (id) => {
    const c = getBillCheck(id)!;
    const url = new URL(c.lookup.url);
    expect(url.protocol).toBe("https:");
    expect((OFFICIAL_LOOKUP_HOSTS as readonly string[]).includes(url.host)).toBe(true);
    expect(c.verification.verifiedOn).toBe("2026-10-01");
    expect(c.verification.sources.length).toBeGreaterThan(0);
  });

  it("uses the verified destinations", () => {
    expect(getBillCheck("lesco")?.lookup.url).toBe("https://bill.pitc.com.pk/lescobill");
    expect(getBillCheck("hazeco")?.lookup.url).toBe("https://bill.pitc.com.pk/hazecobill");
    expect(getBillCheck("ke")?.lookup.url).toBe("https://ke.com.pk/bills-e-payments/");
    expect(getBillCheck("ke")?.lookup.captcha).toBe(true);
    expect(findBillCheckBySlug("iesco-bill-check")?.providerId).toBe("iesco");
    expect(findBillCheckBySlug("iesco-bill-calculator")).toBe(undefined);
  });

  it("only offers identifier types each official page supports", () => {
    expect(getBillCheck("iesco")?.identifiers.map((r) => r.type)).toEqual(["reference-number", "customer-id"]);
    expect(getBillCheck("ke")?.identifiers.map((r) => r.type)).toEqual(["account-number"]);
    expect(getBillCheck("lesco")?.identifiers.find((r) => r.type === "customer-id")?.digits).toBe(11);
    expect(getBillCheck("mepco")?.identifiers.find((r) => r.type === "customer-id")?.digits).toBe(10);
  });
});

describe("config validation rejects bad entries", () => {
  it("unofficial host", () => {
    const c = clone();
    c[0].lookup.url = "https://some-bill-site.example/lesco";
    expect(validateBillCheckConfig(c).join()).toMatch(/not a verified official host/);
  });
  it("http destination", () => {
    const c = clone();
    c[0].lookup.url = "http://bill.pitc.com.pk/lescobill";
    expect(validateBillCheckConfig(c).join()).toMatch(/https/);
  });
  it("duplicate provider and slug", () => {
    const c = clone();
    c.push(structuredClone(c[0]));
    const errors = validateBillCheckConfig(c).join();
    expect(errors).toMatch(/duplicate provider/);
    expect(errors).toMatch(/duplicate slug/);
  });
  it("missing identifiers, sources and bad dates", () => {
    const c = clone();
    (c[0] as unknown as { identifiers: IdentifierRule[] }).identifiers = [];
    (c[1].verification as unknown as { sources: unknown[] }).sources = [];
    c[2].verification.verifiedOn = "yesterday";
    const errors = validateBillCheckConfig(c).join();
    expect(errors).toMatch(/no identifiers/);
    expect(errors).toMatch(/no verification sources/);
    expect(errors).toMatch(/invalid verifiedOn/);
  });
});

describe("identifier validation", () => {
  const ref: IdentifierRule = getBillCheck("iesco")!.identifiers[0];
  const lescoCustomer: IdentifierRule = getBillCheck("lesco")!.identifiers[1];
  const keAccount: IdentifierRule = getBillCheck("ke")!.identifiers[0];

  each<[string, string, string, string | null]>([
    ["plain", REF14, REF14, null],
    ["spaces as printed", "08 11131 1234567", REF14, null],
    ["with U suffix", "08 11131 1234567 U", REF14, "U"],
    ["lower-case r suffix", "08111311234567r", REF14, "R"],
    ["dashes", "08-11131-1234567", REF14, null],
    ["surrounding whitespace", "  08111311234567  ", REF14, null],
    ["non-breaking spaces (pasted)", "08 11131 1234567", REF14, null],
    ["full-width digits (pasted)", "０８１１１３１１２３４５６７", REF14, null],
  ])("accepts %s", (_name, raw, digits, suffix) => {
    const r = validateIdentifier(raw, ref);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.digits).toBe(digits);
      expect(r.value.suffix).toBe(suffix);
    }
  });

  each<[string, string, string]>([
    ["empty", "", "empty"],
    ["whitespace only", "   ", "empty"],
    ["13 digits", "0811131123456", "wrong-length"],
    ["15 digits", "081113112345678", "wrong-length"],
    ["letters inside", "0811131ABC4567", "invalid-characters"],
    ["unsupported suffix", "08111311234567X", "invalid-suffix"],
    ["symbols", "08111311234567#", "invalid-characters"],
    ["script injection", "<script>alert(1)</script>", "invalid-characters"],
  ])("rejects %s", (_name, raw, code) => {
    const r = validateIdentifier(raw, ref);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe(code);
  });

  it("enforces provider-specific lengths (LESCO Customer ID is 11 digits)", () => {
    expect(validateIdentifier("12345678901", lescoCustomer).ok).toBe(true);
    expect(validateIdentifier("1234567890", lescoCustomer).ok).toBe(false);
  });

  it("does not allow a U/R suffix where the rule has none", () => {
    expect(validateIdentifier("1234567890123U", keAccount).ok).toBe(false);
    expect(validateIdentifier("1234567890123", keAccount).ok).toBe(true);
  });

  it("gives useful messages", () => {
    const empty = validateIdentifier("", ref);
    expect(!empty.ok && empty.message).toBe("Please enter your Reference Number.");
    const short = validateIdentifier("123", ref);
    expect(!short.ok && short.message).toMatch(/exactly 14 digits \(you entered 3\)/);
  });
});

describe("lookup preparation (routing)", () => {
  it("routes a valid reference number to the official PITC page", () => {
    const r = prepareBillLookup("fesco", "reference-number", "08 11131 1234567 R");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lookup.destinationUrl).toBe("https://bill.pitc.com.pk/fescobill");
      expect(r.lookup.destinationHost).toBe("bill.pitc.com.pk");
      expect(r.lookup.copyValue).toBe(REF14);
      expect(r.lookup.steps.join(" ")).toMatch(/choose “R”/);
    }
  });

  it("never puts the identifier in the destination URL", () => {
    for (const c of billCheckProviders) {
      const rule = c.identifiers[0];
      const value = "1".repeat(rule.digits);
      const r = prepareBillLookup(c.providerId, rule.type, value);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.lookup.destinationUrl).not.toContain(value);
    }
  });

  it("routes K-Electric to its official page and mentions the CAPTCHA", () => {
    const r = prepareBillLookup("ke", "account-number", "0400 0123 45678");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lookup.destinationUrl).toBe("https://ke.com.pk/bills-e-payments/");
      expect(r.lookup.steps.join(" ")).toMatch(/CAPTCHA/);
    }
  });

  it("uses the Customer ID mode when chosen", () => {
    const r = prepareBillLookup("iesco", "customer-id", "1234567890");
    expect(r.ok && r.lookup.identifier.type).toBe("customer-id");
    expect(r.ok && r.lookup.steps.join(" ")).toMatch(/select “Customer ID”/);
  });

  it("rejects unknown providers and unsupported identifier types", () => {
    const unknown = prepareBillLookup("acme", "reference-number", REF14);
    expect(!unknown.ok && unknown.code).toBe("unknown-provider");
    const unsupported = prepareBillLookup("ke", "customer-id", "1234567890");
    expect(!unsupported.ok && unsupported.code).toBe("unsupported-identifier");
    expect(!unsupported.ok && unsupported.message).toMatch(/does not support/);
  });
});
