# Calculation engine and tariff data

This document explains how bill estimates are produced and how to keep tariff data current. Read it before changing anything in `src/lib/tariffs` or `src/lib/calculator`.

## Principles

1. **No invented figures.** Every rate comes from an official document listed in `src/lib/tariffs/data/sources.ts`, with the page it was read from.
2. **Data, not code.** Tariff values live only in `src/lib/tariffs/data/*`. UI components and the engine contain no tariff numbers.
3. **Versioned, never overwritten.** A tariff change is a new schedule file. The old one is closed, not edited.
4. **Fail safe.** If tariff data fails validation, no engines are registered and calculators show "not available" instead of numbers.
5. **Base tariff and adjustments are separate.** FCA and QTA are separate records keyed by bill month, and are never folded into base rates.

## Architecture

```text
src/lib/tariffs/
  types.ts               Data schema (TariffSchedule, TariffBand, Slab, PeriodicAdjustment, SourceDocument)
  data/sources.ts        Official documents (reference, URL, publication date, page used)
  data/uniform-2026-02.ts  Base tariff version in force from 12 Feb 2026
  data/adjustments.ts    FCA / QTA per bill month, supported bill months
  validate.ts            Structural + consistency checks
  index.ts               Registry of versions; loadTariffData() validates everything
  overview.ts            Read-only views for pages (rate tables, sources list)

src/lib/calculator/
  types.ts               Engine contract (CalculationInput, CalculationResult, CalculationEngine)
  money.ts               Exact fixed-point arithmetic + rounding policy
  slabs.ts               Slab engine (single-slab / one-previous-slab-benefit)
  estimate.ts            Pure estimate for one provider + category + band + month
  schedule-engine.ts     Picks the tariff version for a bill month; builds an engine per provider
  engine-registry.ts     Builds engines from validated data; availability flags; form requirements
  calculate.ts           UI entry point (calculateBill)
  validation.ts          Untrusted form input → CalculationInput
  billing-month.ts       "YYYY-MM" helpers
```

Flow: form input → `validateCalculatorForm` → `calculateBill` → provider engine → `findSchedule(provider, billMonth)` → `calculateEstimate` → `CalculationResult` (lines, slabs, assumptions, exclusions, pending adjustments, tariff version and sources).

Everything that depends on support status derives from the engine registry: provider badges, page indexing, sitemap entries, structured data and the calculator UI.

## Calculation steps (`estimate.ts`)

1. Validate units (whole number, 0 to 1,000,000), bill month (must be supported), band limits (protected ≤ 200 units; lifeline ≤ 100 units and ≤ 1 kW) and sanctioned load (> 0, at most 2 decimals).
2. A sanctioned load at or above the category limit (5 kW) returns `unavailable`. Those connections are time-of-use and not modelled.
3. **Energy charges** come from the slab engine:
   - `single-slab`: all units at the rate of the slab the total falls in (un-protected, lifeline).
   - `one-previous-slab-benefit`: units up to the previous slab's upper bound at its rate, the remainder at the current rate (protected).
4. **Fixed charges**:
   - `per-sanctioned-kw-by-slab`: the per-kW rate of the slab the total falls in × sanctioned load.
   - `per-consumer`: a flat monthly amount.
   - `none` with a minimum charge: the minimum is applied as a floor on energy charges (lifeline).
5. **Adjustments**: for each expected kind (FCA, QTA), find the record for the provider, category and bill month. Excluded bands (lifeline) get no line. A missing record is reported as **pending**, never assumed to be zero.
6. **Total** is the sum of the lines. Taxes are not included (`taxesIncluded: false`).

## Rounding policy (`money.ts`)

- Intermediate values are integers in 1/10,000 rupee. Rates have at most 4 decimals and kW at most 2, so products are exact and nothing is rounded mid-way.
- Each charge line is rounded **once** to the paisa, half away from zero.
- The total is the exact sum of rounded lines. The UI shows the headline figure to the nearest rupee and the breakdown to the paisa.
- Effective cost per unit = total ÷ units, rounded to the paisa. It is `null` at 0 units.

Official bills may round differently. This is stated in every result's assumptions.

## Documented assumptions and interpretations

These are stated in results and on the methodology page:

| Topic | What the source says | What the engine does |
|---|---|---|
| FCA basis | Charged "on the basis of units billed … in the month of <M>" (two months earlier) | Applies the rate to the units entered |
| Fixed charge rate | Per kW for each consumption slab, "based on the sanctioned load" | Uses the slab containing total consumption |
| 0 units | Not explicit | Fixed charges use the first slab's per-kW rate |
| Lifeline minimum | "minimum monthly customer charge … even if no energy is consumed" | Applied as a floor on energy charges (single phase: Rs. 75) |
| Protected > 200 units | Protected means ≤ 200 kWh/month for 6 months | Rejected as an invalid combination rather than re-priced |

## Provider support (as of 2026-10-03)

S.R.O. 279(I)/2026 modifies S.R.O. 41(I)–52(I)/2026 "in respect of XWDISCO's and K-Electric". The figures in Annex-A-1 (XWDISCOs) and Annex-C (K-Electric) are identical, and S.R.O. 1643(I)/2026 confirms K-Electric consumers are charged the XWDISCO tariff. One schedule therefore lists all 12 providers. HAZECO's own notification, S.R.O. 43(I)/2026, substitutes its schedule with the same uniform annexes and is among the S.R.O.s that S.R.O. 279 modifies; S.R.O. 1208(I)/2026 (HAZECO distribution-margin review) leaves consumer-end rates unchanged until a later rebasing. This was checked in the source documents, not assumed. If any provider's rules diverge, give it its own schedule file.

| Scope | Status |
|---|---|
| Residential A-1(a), below 5 kW: un-protected, protected, lifeline | Supported |
| Commercial A-2(a), below 5 kW | Supported |
| Residential A-1(b) and commercial A-2(c) time of use (≥ 5 kW) | Supported since Phase 6 in `/tou-electricity-bill-calculator` (see below) |
| Industrial, agricultural, bulk, general services, prepaid, EVCS | Not supported |
| Taxes and duties (GST, electricity duty, etc.) | Not included: applicability not verified from an official source |
| HAZECO (Hazara Electric Supply Company) | Supported since Phase 5 (verified 2026-10-01 against S.R.O. 43(I)/2026, S.R.O. 279(I)/2026 and the FCA/QTA decisions) |

## Time-of-use (Phase 6)

Engine: `src/lib/calculator/tou.ts` (pure, same money and "not yet notified" rules as the slab engine). Data: `timeOfUse` and `peakHours` in `data/uniform-2026-02.ts`, checked by `validate.ts`.

| Item | Residential A-1(b) | Commercial A-2(c) | Source |
|---|---|---|---|
| Peak rate (Rs/kWh) | 46.85 | 43.82 | S.R.O. 279(I)/2026 Annex-C p20 (legible), matching Annex-A-1 p15 |
| Off-peak rate (Rs/kWh) | 34.53 | 35.15 | same |
| Fixed charge (Rs/kW/month) | 675 | 1,250 | same |
| Billing demand | higher of 50% of sanctioned load and MDI | higher of 25% of sanctioned load and actual MDI | Annex-C Note 2 (residential); Annex-A-1 A-2 note, consistent with "Billing Demand" in LESCO S.R.O. 46 Annex-V Part-I item 4 (commercial) |
| Eligibility | sanctioned load 5 kW and above with TOU metering | same | LESCO S.R.O. 46 Annex-V Part-II A-1 para 3, A-2 para 5 (pages 44–45) |

- FCA and QTA apply to all units, peak and off-peak alike. The decisions apply "to all consumer categories … except lifeline consumers, EVCS and pre-paid consumers".
- No minimum charge applies, because the schedule's minimum charge is waived where fixed charges apply.
- **Peak hours (verified 2026-10-03)**:
  - All eleven ex-WAPDA companies' own notifications (S.R.O. 41–51 of 13 Jan 2026, Annex-V Part-I item 10) state the same hours: Dec–Feb 5–9 PM, Mar–May 6–10 PM, Jun–Aug 7–11 PM, Sep–Nov 6–10 PM, adjusted for daylight saving.
  - The A-1 lifeline, protected and un-protected definitions and A-1(b) eligibility read the same in all eleven, and in K-Electric's S.R.O. 1643.
  - **K-Electric (resolved 2026-10-03):** Apr–Oct 6:30–10:30 PM, Nov–Mar 6–10 PM, from the terms annexed to S.R.O. 1643 (Part-I item 10). Phase 7 held these back because S.R.O. 52 keeps K-Electric's 2019 terms in force. K-Electric's own tariff page (<https://ke.com.pk/tariff-structure/>) states the same hours, so two official sources agree. The source registry cites S.R.O. 1643 (nepra.org.pk only); the K-Electric page is mentioned in the note. The calculator does not use hours, because bills give peak and off-peak units.
- Commercial 5 kW+ connections without a TOU meter are billed on A-2(b), a single rate, which is not modelled. The TOU page says so.
- The Annex-A-1 scan is about 96 dpi. Rates were taken from the legible Annex-C, which S.R.O. 1643 confirms is the same XWDISCO tariff, and cross-checked against the readable digits of Annex-A-1. Re-check both annexes when the schedule changes.

## Updating data

### Current period status (re-checked 2026-10-03, Phase 8)

| Bill month | Base tariff | FCA | QTA |
|---|---|---|---|
| August 2026 | S.R.O. 279 | June fuel, Rs 0.7503 (S.R.O. 1336) | Q1 CY 2026, −Rs 1.9857 (S.R.O. 953) |
| September 2026 | S.R.O. 279 | July fuel, Rs 2.0581 (S.R.O. 1499) | Q2 CY 2026, Rs 0.5194 (S.R.O. 1501) |
| October 2026 | S.R.O. 279 | **Not yet notified** (August fuel: hearing held 29 Sep 2026, decision not published) | Q2 CY 2026 |
| November 2026 | S.R.O. 279 | **Not yet notified** (September fuel) | Q2 CY 2026 |
| December 2026 | not offered | not decided | Q3 CY 2026 not decided |

Latest supported bill month: November 2026. NEPRA's LESCO/XWDISCO tariff page listed nothing newer than the July FCA and Q2 QTA decisions (both 4 Sep 2026). December is added only once its QTA status is known (see below).

### Monthly FCA (usually early each month)

Every FCA is a **new record**. Never edit or reuse an earlier one.

1. Download NEPRA's "Fuel Charges Adjustment for the month of <M>" decision for XWDISCOs from nepra.org.pk.
2. Read the **decision paragraph** (usually para 4), not the request table. Record:

   | Field | Where it goes |
   |---|---|
   | Decision / S.R.O. number | `SourceDocument.reference` (must match `S.R.O. n(I)/yyyy`) |
   | Decision date | `SourceDocument.publishedOn` and `PeriodicAdjustment.decidedOn` |
   | Fuel month (the month the FCA is "for") | `basis: { kind: "units-of-month", month: "<M>" }` |
   | Bill month it is charged in ("reflect in the billing month of …") | `billingMonths` |
   | Rs/kWh (sign included) | `ratePerUnit` |
   | Categories and exclusions (e.g. lifeline, EVCS, prepaid) | `categories`, `excludedBandIds`, `applicability` (copied wording) |
   | Providers (XWDISCOs and/or K-Electric) | `providers` |
   | Official PDF | `SourceDocument.url` (nepra.org.pk only) |

3. Add the `SourceDocument` with `kind: "fca"` and `appliesTo: "all"` (or the named companies), and a `PeriodicAdjustment` with `kind: "fca"`.
4. Validation rejects a second FCA for the same provider, category and bill month, an FCA citing a non-FCA document, and a document that does not apply to a listed provider.
5. Until the decision exists, add nothing. The calculators show **"Not yet notified"** for that bill month.
6. Update `lastVerifiedOn` and run `npm test`.

Do not use press reports for rates or exclusions. For example, a report on the June 2026 FCA said protected consumers were excluded, but the decision text excludes only lifeline, EVCS and prepaid consumers.

### Quarterly QTA

Same process, each quarter as a new record:
- `kind: "qta"` on both the source and the adjustment;
- `basis: { kind: "current-bill" }`;
- `billingMonths` set to exactly the bill months the decision names. Never spread one value over undocumented months;
- the quarter (e.g. "Q3 CY 2026") in `label`, and the categories and exclusions from the notification paragraphs.

Add the next bill month to `supportedBillingMonths` only when its QTA is decided (the FCA may still be "not yet notified").

### Provider-specific notifications

Each company's own schedule-of-tariff notification goes in `providerSourceIds` with `kind: "provider-notification"` and `appliesTo: ["<company>"]`. Validation keeps shared and company-specific sources apart:
- a company's notification can never be a shared source;
- it can never be cited for another company.

The same applies to peak hours: each company's hours cite its own notification.

### New base tariff (e.g. annual rebasing)

1. Create `data/<name>.ts` with a **new `id`**. Transcribe from the GoP-applicable column and record page numbers in the source's `location`.
2. Close the previous schedule: set `effectiveTo` and `lastBillingMonth`.
3. Register the file in `tariffSchedules` (`index.ts`).
4. Add hand-computed expected outputs to `tests/engine.test.ts` for slab boundaries.
5. `npm test` must pass. Validation rejects overlapping versions, gaps, missing sources and implausible values.

### Verification checklist

- [ ] Source is an official NEPRA or Government of Pakistan document (URL on `nepra.org.pk`)
- [ ] Figures read from the GoP-applicable column, cross-checked against a second annex where one exists
- [ ] Effective date and bill months taken from the document text
- [ ] Applicability and exclusions copied from the decision paragraph
- [ ] Tests updated with hand-computed values
- [ ] `lastVerifiedOn` set to the date you checked

## Tests

Run `npm test` (Node's built-in test runner with a TypeScript-transpiling hook in `tests/support/`, so no native build tools are needed).

- `engine.test.ts`: exact outputs at every slab boundary, all bands, adjustments, limits, metadata
- `tariff-data.test.ts`: production data validity and official figures, plus malformed-data rejection
- `versioning.test.ts`: version selection, expired and future tariffs, provider-specific schedules (fixtures only)
- `math.test.ts`: money, rounding, slab engine, bill-month helpers
- `form-validation.test.ts`: untrusted input handling
- `routes.test.ts`: static params, sitemap, availability and requirements wiring
- `calculator-ui.test.tsx`: end-to-end interaction in jsdom
