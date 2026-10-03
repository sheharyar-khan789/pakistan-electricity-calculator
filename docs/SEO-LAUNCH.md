# SEO launch and Search Console guide

This guide covers everything needed to take the site live and indexable. Nothing here can be done automatically: deploying, DNS and Google accounts belong to the site owner.

## 1. Production environment

Set these on the **production** deployment only (e.g. Vercel → Project → Settings → Environment Variables → Production):

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` | Bare https origin. No path, no trailing slash. The source of every canonical, Open Graph URL, sitemap URL, robots sitemap line and structured-data URL. |
| `NEXT_PUBLIC_ENABLE_INDEXING` | `true` | Only the exact string `true` enables indexing. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | token from Search Console | Optional; only for the HTML-tag method (section 3). |
| `NEXT_PUBLIC_CONTACT_EMAIL` | a real inbox | Recommended before launch, so /contact has a working channel. |

**Safety rules built into `src/config/site.ts`:**

- If indexing is `true` but the site URL is missing, `http://`, localhost or `*.vercel.app`, **the build fails** with a clear message. No localhost or preview canonical can reach production.
- Vercel **preview** deployments (`VERCEL_ENV=preview`) are never indexed, even if the variable is set.
- With indexing off, every page has `noindex, nofollow` and robots.txt is `Disallow: /`. The sitemap still builds but is not advertised; it is harmless because crawling is disallowed.
- With indexing on, robots.txt allows everything (CSS/JS included) and advertises `<origin>/sitemap.xml`. Any calculator page without verified tariff data would carry `noindex, follow` and be left out of the sitemap; currently every provider calculator is supported.

All of this is covered by `tests/seo.test.ts`.

## 2. Domain and HTTPS (if hosting on Vercel)

1. Vercel → Project → Settings → Domains → add your domain (apex and/or `www`).
2. At your DNS provider, add the records Vercel shows. Typically an `A` record for the apex pointing to Vercel's IP, and a `CNAME` for `www` to `cname.vercel-dns.com`. Use the exact values Vercel displays.
3. Pick **one** primary host (with or without `www`) and set the other to redirect to it in Vercel's Domains settings. Use that primary host in `NEXT_PUBLIC_SITE_URL`.
4. Vercel issues HTTPS certificates automatically. Wait until the domain shows "Valid Configuration".
5. Redeploy production after setting the environment variables, because `NEXT_PUBLIC_*` values are inlined at build time.

## 3. Google Search Console

**Choose a verification method:**

- **Domain property (recommended):** covers http/https and www/non-www. Search Console gives you a **DNS TXT record**. Add it at your DNS provider; no code change is needed.
- **URL-prefix property with HTML tag:** Search Console shows `<meta name="google-site-verification" content="XXXX" />`. Put **only** `XXXX` in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy. The tag then appears on every page, and the build rejects a pasted full tag.

**Then:**

1. Verify ownership in Search Console.
2. **Sitemaps** → submit `sitemap.xml`. The full URL is `https://<your-domain>/sitemap.xml`.
3. **URL Inspection** → inspect `/`, `/electricity-bill-check` and a few provider pages (e.g. `/lesco-bill-check`, `/iesco-bill-check`, `/ke-bill-check`). Use "Request indexing" for these key URLs.
4. Watch the **Pages** report for coverage problems over the following weeks.
5. Watch **Core Web Vitals** once there is enough field data.
6. Watch **Performance → Queries** to learn which searches actually bring impressions. Let that data, not assumptions about volume, guide new content.

## 4. Launch checklist (owner)

Only the site owner can do these. Nothing here is deployed or configured automatically.

| # | Step | How to check |
|---|---|---|
| 1 | **Production domain** chosen and owned | Registrar shows you as owner |
| 2 | **DNS** records added as Vercel shows them; one primary host, the other redirecting | Vercel → Domains shows "Valid Configuration" |
| 3 | **Vercel project:** production branch set; env vars set for **Production only** | Vercel → Settings → Environment Variables |
| 4 | `NEXT_PUBLIC_SITE_URL` = `https://<your-domain>` (no path or trailing slash) | `npm run check:launch` (below) |
| 5 | `NEXT_PUBLIC_ENABLE_INDEXING=true` on Production only, never on Preview | Preview pages still show `noindex` |
| 6 | `NEXT_PUBLIC_CONTACT_EMAIL` = a real inbox you read | `/contact` shows the address; the build fails on a malformed value |
| 7 | **Search Console** verified (DNS TXT, or `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`) | Search Console shows "Ownership verified" |
| 8 | **Sitemap** `https://<domain>/sitemap.xml` submitted | Search Console → Sitemaps: "Success" |
| 9 | **Key URLs inspected**: `/`, `/electricity-bill-check`, `/lesco-bill-check`, `/iesco-bill-check`, `/ke-bill-check`, `/electricity-bill-calculator` | URL Inspection → "URL is on Google" or indexing requested |
| 10 | **Mobile** check on a real phone: bill checker, one provider page, one calculator | No sideways scrolling; buttons usable |
| 11 | **Production build** redeployed after setting env vars (`NEXT_PUBLIC_*` values are inlined at build) | Vercel deployment uses the latest commit |
| 12 | **Site audit** of the live site: `node scripts/audit-site.mjs https://<domain>` | "No problems found."; robots `Allow: /` |
| 13 | **Provider verification**: `npm run verify:providers` on launch day | All providers PASS (K-Electric CAPTCHA is a NOTICE) |
| 14 | **Contact page** works: send yourself a test email via the link | Mail arrives |
| 15 | **Privacy and legal review** of /privacy-policy, /terms and /disclaimer, ideally by a lawyer; update `LEGAL_LAST_UPDATED` after edits | Dates on the pages match |

**Readiness check before deploying.** Run with the values you will use in production. It only reads them; nothing is stored or sent.

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain NEXT_PUBLIC_ENABLE_INDEXING=true NEXT_PUBLIC_CONTACT_EMAIL=you@your-domain npm run check:launch
```

It lists blockers (missing URL, indexing or contact email) and warnings (no Search Console tag, which is fine with DNS verification), and exits 1 while any blocker remains.

To check a running production build locally: `npm run build && npm start`, then `node scripts/audit-site.mjs http://localhost:3000`.

**Local `.next` output is not a deployment artifact.** Vercel builds from source with its own env vars. A local build is only representative if it was built with the same production values.

## 5. Monitoring

| What | How | When |
|---|---|---|
| Official bill pages still match config | `npm run verify:providers`: reads each public form, never submits an identifier | Monthly, and when a user reports a broken link |
| A provider page changed | Fix `src/lib/bill-check/providers.ts`, or set `status: "verification-pending"` to switch it off safely | Immediately |
| Tariff and adjustment data current | Follow `docs/CALCULATION.md`: monthly FCA, quarterly QTA, annual rebasing | Monthly |
| SEO health of a build | `node scripts/audit-site.mjs <url> --inventory docs/PAGE-INVENTORY.md` | Before each release |
| Indexing, queries, Core Web Vitals | Google Search Console | Weekly after launch |

## 6. Content and traffic strategy

There are no guarantees. Rankings and traffic depend on Google and competitors. The goal is the strongest legitimate foundation.

| Tier | Intent | Covered by |
|---|---|---|
| 1 | “[provider] bill check” | 12 provider bill-check pages, built from verified per-provider rules |
| 2 | “[provider] reference number / customer ID” | Provider-page sections and FAQ; reference number guide |
| 3 | duplicate bill, bill download, bill payment | Provider-page sections (download/print, payment) |
| 4 | how to read a bill, what is a reference number | Two guides |
| 4b | units from meter reading, appliance / AC units and cost | Unit, appliance and AC calculators (formula-based) |
| 5b | time-of-use / 5 kW+ bills, peak and off-peak | TOU bill calculator |
| 5 | bill / unit calculators | Bill calculator, 12 provider calculators, unit, appliance and AC calculators |

Rules: no doorway or keyword-permutation pages, and no mass-generated articles. Add a page only when it answers a real question with verified facts. Use Search Console query data to decide what to write next.

## 7. AdSense readiness (not integrated)

Already in place: About, Contact, Privacy Policy, Terms, Disclaimer, original content, clear navigation, and no deceptive UI.

**Before applying:**
- set a real contact email;
- update the privacy policy to describe AdSense cookies and consent (required before any ad code runs);
- get a lawyer's review of the legal pages.

No ad code or placeholder ad slots exist.

## 8. Analytics

No analytics provider is connected. `src/lib/analytics.ts` defines typed events:
- `provider_selected`;
- `bill_check_started`, `bill_check_redirected` and `bill_check_failed` (error code only);
- `calculator_started` and `calculator_completed` (bill calculator: provider and category; energy tools: tool id and outcome only);
- `tool_selected` (tool id and where it was chosen);
- `guide_interaction` (type defined, not emitted yet).

The types make it impossible to pass reference numbers, Customer IDs, account numbers, bill amounts or free text. To add a provider, register a sink with `setAnalyticsSink`, and update the privacy policy and consent handling first.

## 9. Search Console decision framework

No Search Console performance data was available up to Phase 6. When it exists, decide what to build from it like this:

1. **Export** Performance → Queries and Pages for the last 3 months (country: Pakistan), with clicks, impressions, CTR and position. Keep the export with the date range in the report. Never quote figures that were not exported.
2. **Group queries by intent**, not by keyword:
   - bill check (generic and per provider);
   - reference number / customer ID;
   - duplicate bill / download / payment;
   - bill calculation;
   - units;
   - appliance and AC cost;
   - TOU;
   - tariff, FCA and QTA;
   - solar and net billing.
3. **Classify each group:**
   - **A. Satisfied:** a page already answers it and ranks. Improve it only if CTR is weak for its position (title and description match the query; no clickbait).
   - **B. Partly satisfied:** a page answers part of it. Expand that page with the missing section or FAQ.
   - **C. New intent:** no page answers it, and the answer can be backed by official sources or formulas. Consider one new page or tool.
   - **D. Weak or irrelevant:** too few impressions to act on, or off-topic. Do nothing.
4. **Never** create one page per query, per keyword variant or per city. Provider pages stay one per provider.
5. **After changing a page,** record the date and compare like-for-like periods. Report only measured changes.

Provider pages are changed only when the data shows a reason. Examples: high impressions with low CTR, queries the page does not answer, or relevant queries landing on the wrong page.
