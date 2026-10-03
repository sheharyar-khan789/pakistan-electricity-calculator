/**
 * Provider re-verification: checks that each official bill page still
 * matches our configuration (fields, labels, digit lengths, CAPTCHA).
 *
 *   npm run verify:providers
 *
 * SAFETY: this script NEVER submits a customer identifier. The only POST it
 * makes is the ASP.NET postback a browser performs when "Customer ID" is
 * selected on a PITC page, with an EMPTY search box. It does not attempt to
 * retrieve bills or solve CAPTCHAs. Exit code 1 if anything needs attention.
 */
import { getProvider } from "@/data/providers";
import { billCheckProviders } from "@/lib/bill-check/providers";
import type { BillCheckProvider } from "@/lib/bill-check/types";

type Level = "PASS" | "NOTICE" | "WARNING" | "FAIL";
type Finding = { level: Level; message: string };

const TIMEOUT_MS = 30_000;
const UA = "Mozilla/5.0 (compatible; provider-form-verification)";

/** Remove HTML comments so commented-out markup (e.g. "<!-- CAPTCHA -->") is not mistaken for live elements. */
const stripComments = (html: string) => html.replace(/<!--[\s\S]*?-->/g, "");

function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1];
}

function findTag(html: string, pattern: RegExp): string | undefined {
  return html.match(pattern)?.[0];
}

/** Live CAPTCHA indicators: reCAPTCHA/hCaptcha/Turnstile scripts or elements whose id/name mentions captcha. */
function hasLiveCaptcha(html: string): boolean {
  const live = stripComments(html);
  return (
    /(recaptcha|hcaptcha|turnstile|challenges\.cloudflare)/i.test(live) ||
    /<(img|input|span|div|canvas)[^>]*(id|name|class)="[^"]*captcha[^"]*"/i.test(live)
  );
}

class Session {
  private cookies = new Map<string, string>();
  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("user-agent", UA);
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    const res = await fetch(url, { ...init, headers, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      if (i > 0) this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
    return res;
  }
}

async function checkPitc(config: BillCheckProvider): Promise<Finding[]> {
  const out: Finding[] = [];
  const session = new Session();
  const res = await session.fetch(config.lookup.url);
  if (!res.ok) return [{ level: "FAIL", message: `official page returned HTTP ${res.status}` }];
  const html = await res.text();
  const form = findTag(html, /<form[^>]*>/i);
  if (!form) return [{ level: "WARNING", message: "search form not found — page structure changed" }];

  const ref = config.identifiers.find((r) => r.type === "reference-number");
  const customer = config.identifiers.find((r) => r.type === "customer-id");
  const box = findTag(html, /<input[^>]*id="searchTextBox"[^>]*>/i);
  const hasRadio = (value: string) => new RegExp(`name="rbSearchByList"[^>]*value="${value}"`, "i").test(html);
  const label = (n: number) => html.match(new RegExp(`for="rbSearchByList_${n}"[^>]*>\\s*([^<]*)`, "i"))?.[1]?.trim();

  if (ref) {
    if (!hasRadio("refno") || label(0) !== ref.officialLabel) {
      out.push({ level: "WARNING", message: `expected “${ref.officialLabel}” option not found (found “${label(0) ?? "none"}”)` });
    } else if (!box || Number(attr(box, "maxlength")) !== ref.digits) {
      out.push({ level: "WARNING", message: `reference field length changed (expected ${ref.digits}, found ${box ? attr(box, "maxlength") : "no field"})` });
    } else {
      out.push({ level: "PASS", message: `“${ref.officialLabel}” field found, ${ref.digits} digits` });
    }
    const options = [...html.matchAll(/<select[^>]*name="ruCodeTextBox"[\s\S]*?<\/select>/gi)][0]?.[0] ?? "";
    const letters = [...options.matchAll(/<option[^>]*>([^<]*)<\/option>/gi)].map((m) => m[1].trim()).filter(Boolean);
    const expected = ref.suffixes ?? [];
    if (expected.every((s) => letters.includes(s))) out.push({ level: "PASS", message: `U/R list found (${letters.join("/")})` });
    else out.push({ level: "WARNING", message: `suffix list changed (expected ${expected.join("/")}, found ${letters.join("/") || "none"})` });
  }

  if (customer) {
    if (!hasRadio("appno") || label(1) !== customer.officialLabel) {
      out.push({ level: "WARNING", message: `expected “${customer.officialLabel}” option not found (found “${label(1) ?? "none"}”)` });
    } else {
      // Select "Customer ID" exactly as a browser does: postback with an EMPTY search box.
      const body = new URLSearchParams();
      for (const m of html.matchAll(/<input[^>]*type="hidden"[^>]*>/gi)) {
        const name = attr(m[0], "name");
        if (name) body.append(name, attr(m[0], "value") ?? "");
      }
      body.set("__EVENTTARGET", "rbSearchByList$1");
      body.set("rbSearchByList", "appno");
      body.set("searchTextBox", "");
      body.set("ruCodeTextBox", "");
      try {
        const post = await session.fetch(config.lookup.url, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        });
        const after = await post.text();
        const box2 = findTag(after, /<input[^>]*id="searchTextBox"[^>]*>/i);
        const len = box2 ? Number(attr(box2, "maxlength")) : NaN;
        if (len === customer.digits) out.push({ level: "PASS", message: `“${customer.officialLabel}” field found, ${len} digits` });
        else if (Number.isNaN(len)) out.push({ level: "NOTICE", message: "could not read the Customer ID field automatically — check manually" });
        else out.push({ level: "WARNING", message: `Customer ID length changed (expected ${customer.digits}, found ${len})` });
      } catch (error) {
        out.push({ level: "NOTICE", message: `could not switch to Customer ID automatically (${(error as Error).message}) — check manually` });
      }
    }
  }

  const captcha = hasLiveCaptcha(html);
  if (captcha !== config.lookup.captcha) {
    out.push({ level: "WARNING", message: captcha ? "a CAPTCHA now appears on the page" : "expected CAPTCHA no longer found" });
  }
  return out;
}

async function checkKe(config: BillCheckProvider): Promise<Finding[]> {
  const out: Finding[] = [];
  const session = new Session();
  const res = await session.fetch(config.lookup.url);
  if (!res.ok) return [{ level: "FAIL", message: `official page returned HTTP ${res.status}` }];
  const page = await res.text();
  const iframe = page.match(/<iframe[^>]*src="([^"]*DuplicateBill[^"]*)"/i)?.[1];
  if (!iframe) return [{ level: "WARNING", message: "embedded Duplicate Bill form not found — page structure changed" }];
  out.push({ level: "PASS", message: `official page loads; embedded form at ${new URL(iframe, config.lookup.url).host}` });

  const formRes = await session.fetch(new URL(iframe, config.lookup.url).toString());
  if (!formRes.ok) return [...out, { level: "FAIL", message: `embedded form returned HTTP ${formRes.status}` }];
  const html = await formRes.text();
  const account = config.identifiers.find((r) => r.type === "account-number");
  const field = findTag(html, /<input[^>]*name="txtAccNo"[^>]*>/i);
  if (!account || !field) {
    out.push({ level: "WARNING", message: "Account Number field not found" });
  } else if (new RegExp(`${account.digits}-digits`, "i").test(html)) {
    out.push({ level: "PASS", message: `“${account.officialLabel}” field found, ${account.digits}-digit hint present` });
  } else {
    out.push({ level: "WARNING", message: `${account.digits}-digit hint no longer found next to Account Number` });
  }
  const captcha = /captcha/i.test(stripComments(html));
  if (captcha && config.lookup.captcha) out.push({ level: "NOTICE", message: "CAPTCHA detected (expected — users complete it on the official page)" });
  else if (captcha !== config.lookup.captcha) {
    out.push({ level: "WARNING", message: captcha ? "a CAPTCHA now appears" : "expected CAPTCHA no longer found" });
  }
  return out;
}

async function main() {
  let attention = 0;
  for (const config of billCheckProviders) {
    const name = getProvider(config.providerId).shortName;
    let findings: Finding[];
    try {
      findings = config.lookup.method === "pitc-web-bill" ? await checkPitc(config) : await checkKe(config);
    } catch (error) {
      findings = [{ level: "FAIL", message: `could not reach official page (${(error as Error).message})` }];
    }
    console.log(`\n${name} — ${config.lookup.url}`);
    for (const f of findings) {
      console.log(`  ${f.level.padEnd(7)} ${f.message}`);
      if (f.level === "WARNING" || f.level === "FAIL") attention++;
    }
  }
  console.log(attention ? `\n${attention} item(s) need attention. Update src/lib/bill-check/providers.ts or set status "verification-pending".` : "\nAll providers match the configuration.");
  process.exitCode = attention ? 1 : 0;
}

await main();
