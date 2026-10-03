# Bill checker: architecture, verification and updates

The bill checker is the site's primary product. It **does not retrieve bills**. It validates the user's identifier against the provider's verified rules, then hands off to the provider's **official** bill page in a new tab. The user finishes there.

## Why it hands off instead of fetching

Checked on 2026-10-01:

- **PITC Web Bill** (`bill.pitc.com.pk/<company>bill`) is an ASP.NET form posted with `__VIEWSTATE`, `__EVENTVALIDATION` and an anti-forgery token. It cannot be pre-filled or submitted from another site without impersonating a browser session.
- GEPCO's own website once deep-linked to `bill.pitc.com.pk/gepcobill/general?refno=…`, but that code is **commented out**. It now opens the plain page. Pre-filled links are therefore not a supported path.
- **K-Electric**'s Duplicate Bill form (embedded in `ke.com.pk/bills-e-payments/`) requires a **CAPTCHA**.

Scraping, replaying tokens or solving CAPTCHAs is out of scope by design. The honest flow is validate → copy number → open the official page.

## Architecture

```text
src/lib/bill-check/
  types.ts       BillCheckProvider, IdentifierRule, LookupMethod, results
  providers.ts   Verified configuration per provider (URLs, identifier rules, sources, notes)
  validation.ts  validateIdentifier(raw, rule): pure, provider-aware
  adapters.ts    One adapter per lookup method → steps to finish on the official page
  registry.ts    Config validation (fail-safe), lookups by id/slug, prepareBillLookup()
  content.ts     Page copy derived only from config (FAQ, summaries)
src/lib/analytics.ts  Typed, identifier-free events; no sink configured
src/components/bill-check/  BillChecker (client form), BillCheckSections (grid, table, links)
src/components/providers/   ProviderBillCheckView, ProviderCalculatorView, ProviderFacts
src/app/[providerPage]/     /<provider>-bill-check and /<provider>-bill-calculator from config
src/app/electricity-bill-check/  Hub page
```

Flow: `BillChecker` → `prepareBillLookup(provider, identifierType, raw)` → `validateIdentifier` → adapter → `PreparedLookup { destinationUrl, copyValue, steps }` → an `<a target="_blank" rel="noopener noreferrer">` to the official page. Clicking it copies the number to the clipboard (best effort).

React components contain no provider rules. Identifier types shown in the form come from the provider's `identifiers` list, so an unsupported option is never shown.

## Validation rules

Implemented in `validation.ts`:

- Strips spaces (including non-breaking), dashes, dots and slashes, and normalises full-width digits (NFKC).
- Allows a single trailing suffix letter only where the rule lists one (`U`/`R` for PITC reference numbers).
- Requires exactly `rule.digits` digits.
- Messages: "Please enter your Reference Number.", "… format does not look valid. It should have exactly 14 digits (you entered 9).", "This provider does not support that lookup here. …"

## Verified configuration (2026-10-01)

| Provider | Destination | Identifiers (from the official form) | Provider-side evidence |
|---|---|---|---|
| LESCO | bill.pitc.com.pk/lescobill | Reference No 14 + U/R; **Customer ID 11** | lesco.gov.pk links its own `bill.lesco.gov.pk` service |
| IESCO | bill.pitc.com.pk/iescobill | Reference No 14 + U/R; Customer ID 10 | iesco.com.pk links to the page |
| MEPCO | bill.pitc.com.pk/mepcobill | same | mepco.com.pk links to the page |
| FESCO | bill.pitc.com.pk/fescobill | same | fesco.com.pk links to the page |
| GEPCO | bill.pitc.com.pk/gepcobill | same | gepco.com.pk Duplicate Bill opens the page |
| PESCO | bill.pitc.com.pk/pescobill | same | PESCO website unreachable; PITC page verified directly |
| HESCO | bill.pitc.com.pk/hescobill | same | hesco.gov.pk links to the page |
| SEPCO | bill.pitc.com.pk/sepcobill | same | sepco.com.pk links to PITC Web Bill |
| QESCO | bill.pitc.com.pk/qescobill | same | qesco.com.pk links to the page |
| TESCO | bill.pitc.com.pk/tescobill | same | tesco.gov.pk links to the page |
| HAZECO | bill.pitc.com.pk/hazecobill | same | Listed on PITC Web Bill home; own website not verified |
| K-Electric | ke.com.pk/bills-e-payments/ | Account Number 13 (Consumer Number 8, optional) | Official KE page; CAPTCHA required |

Customer ID lengths were read by selecting "Customer ID" on each PITC page. This reloads the form with the Customer ID rules (`maxlength` and placeholder). **No identifier was ever submitted.**

## How to re-verify a provider

1. Open the official page. Read the form's labels, `maxlength`, placeholder and any CAPTCHA (view source or browser DevTools).
2. For PITC pages, select each search option to read its rules. **Do not submit any number.**
3. Confirm the destination is linked from the provider's own website, or from PITC/K-Electric.
4. Update `providers.ts`: identifiers, notes, `verification.method`, `verification.sources`, and `VERIFIED_ON`.
5. A new destination host must be added to `OFFICIAL_LOOKUP_HOSTS` in `registry.ts` deliberately, otherwise validation fails safe.
6. Run `npm test`. `tests/bill-check.test.ts` checks hosts, identifier lengths and routing.

To disable a provider whose official page stops working, set its `status` to `"verification-pending"`. Its card then shows "Verification in progress", the page drops out of the sitemap and becomes `noindex`, and the checker returns a friendly "not available" message.

## Privacy and security

- Identifiers live only in React state. They are never stored, logged, sent to this site's servers, put in URLs, or included in analytics (the event types make this impossible).
- External links use `target="_blank" rel="noopener noreferrer"`.
- No `eval`, no HTML injection, no backend, no database.

## Analytics

`track()` accepts only `provider_selected`, `bill_check_started`, `bill_check_redirected`, `bill_check_failed` (with an error code) and the `calculator_*` events. No sink is registered. Before adding one, update the privacy policy and get consent where required.
