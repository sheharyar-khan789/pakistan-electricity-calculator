import { getProvider, isProviderId, PROVIDER_IDS, type ProviderId } from "@/data/providers";
import { prepareLookupFor } from "./adapters";
import { billCheckProviders } from "./providers";
import type { BillCheckProvider, IdentifierType, LookupResult } from "./types";
import { validateIdentifier } from "./validation";

/**
 * Bill-check registry. Configurations that fail `validateBillCheckConfig`
 * are never exposed, so a malformed entry fails safe ("unavailable").
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Hosts verified as official lookup destinations. A new host must be added here deliberately. */
export const OFFICIAL_LOOKUP_HOSTS = ["bill.pitc.com.pk", "ke.com.pk"] as const;

export function validateBillCheckConfig(configs: readonly BillCheckProvider[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const c of configs) {
    const at = `bill-check "${c.providerId}"`;
    if (!isProviderId(c.providerId)) errors.push(`${at}: unknown provider`);
    if (ids.has(c.providerId)) errors.push(`${at}: duplicate provider`);
    ids.add(c.providerId);
    if (slugs.has(c.slug)) errors.push(`${at}: duplicate slug`);
    slugs.add(c.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*-bill-check$/.test(c.slug)) errors.push(`${at}: invalid slug`);

    let url: URL | null = null;
    try {
      url = new URL(c.lookup.url);
    } catch {
      errors.push(`${at}: invalid lookup URL`);
    }
    if (url) {
      if (url.protocol !== "https:") errors.push(`${at}: lookup URL must use https`);
      if (!(OFFICIAL_LOOKUP_HOSTS as readonly string[]).includes(url.host)) {
        errors.push(`${at}: lookup host ${url.host} is not a verified official host`);
      }
    }
    if (c.identifiers.length === 0) errors.push(`${at}: no identifiers`);
    const types = new Set<IdentifierType>();
    for (const rule of c.identifiers) {
      if (types.has(rule.type)) errors.push(`${at}: duplicate identifier ${rule.type}`);
      types.add(rule.type);
      if (!Number.isInteger(rule.digits) || rule.digits < 4 || rule.digits > 20) {
        errors.push(`${at}: implausible digit count for ${rule.type}`);
      }
      if (rule.suffixes?.some((s) => !/^[A-Z]$/.test(s))) errors.push(`${at}: suffixes must be single capitals`);
    }
    if (!ISO_DATE.test(c.verification.verifiedOn)) errors.push(`${at}: invalid verifiedOn`);
    if (c.verification.sources.length === 0) errors.push(`${at}: no verification sources`);
    for (const s of c.verification.sources) {
      if (!/^https?:\/\//.test(s.url)) errors.push(`${at}: invalid source URL`);
    }
  }
  return errors;
}

const configErrors = validateBillCheckConfig(billCheckProviders);
if (configErrors.length > 0) console.error("Bill-check configuration is invalid; checkers disabled.", configErrors);
const active: readonly BillCheckProvider[] = configErrors.length === 0 ? billCheckProviders : [];

const byId = new Map(active.map((c) => [c.providerId, c]));
const bySlug = new Map(active.map((c) => [c.slug, c]));

export function getBillCheck(providerId: ProviderId): BillCheckProvider | undefined {
  return byId.get(providerId);
}

export function findBillCheckBySlug(slug: string): BillCheckProvider | undefined {
  return bySlug.get(slug);
}

export function isBillCheckSupported(providerId: ProviderId): boolean {
  return getBillCheck(providerId)?.status === "supported";
}

/** Every provider, in display order, with its config if one exists. */
export function listBillCheckProviders(): { providerId: ProviderId; config: BillCheckProvider | undefined }[] {
  return PROVIDER_IDS.map((providerId) => ({ providerId, config: byId.get(providerId) }));
}

export function billCheckPath(config: BillCheckProvider): string {
  return `/${config.slug}`;
}

/**
 * Validates input and prepares the official hand-off. Never stores, logs or
 * transmits the identifier.
 */
export function prepareBillLookup(providerId: string, identifierType: string, raw: string): LookupResult {
  if (!isProviderId(providerId)) {
    return { ok: false, code: "unknown-provider", message: "Please select your electricity provider." };
  }
  const name = getProvider(providerId).shortName;
  const config = getBillCheck(providerId);
  if (!config || config.status !== "supported") {
    return {
      ok: false,
      code: "provider-unavailable",
      message: `Online bill check for ${name} is not available here yet. Please use ${name}’s official website.`,
    };
  }
  const rule = config.identifiers.find((r) => r.type === identifierType);
  if (!rule) {
    const kinds = config.identifiers.map((r) => r.label).join(" or ");
    return {
      ok: false,
      code: "unsupported-identifier",
      message: `This provider does not support that lookup here. Use your ${kinds}.`,
    };
  }
  const validation = validateIdentifier(raw, rule);
  if (!validation.ok) return validation;
  return { ok: true, lookup: prepareLookupFor(config, validation.value) };
}
