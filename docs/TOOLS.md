# Electricity tools (Phase 5)

Three formula-based tools sit next to the tariff bill calculator. Their calculations are pure functions in `src/lib/energy/` and are covered by `tests/energy.test.ts` (calculations, parsing, validation, rounding, rate options) and `tests/tools-ui.test.tsx` (forms, errors, results, analytics payloads).

| Route | Purpose | Formula | Tariff dependency |
|---|---|---|---|
| `/electricity-unit-calculator` | Units from two meter readings | units = current − previous; average = units ÷ days; month ≈ average × 30 | None |
| `/appliance-electricity-calculator` | Units and cost of one or more appliances | kWh/day = W × qty × hours ÷ 1000; kWh/month = kWh/day × days; cost = kWh/month × rate | Optional: rate typed by the user, or picked from verified slab rates |
| `/ac-electricity-cost-calculator` | Units and cost of an AC | as appliance, with W × (time at rated power ÷ 100) | Same as appliance |

1 unit = 1 kWh throughout.

## Rules

- **No default or "official universal" rate.** The rate field starts empty, and units alone are shown until a rate is entered. `getRateOptions()` (`src/lib/energy/tariff-rates.ts`) lists each verified slab's energy rate plus whichever of the FCA and QTA have been notified for the default bill month (a missing one is named as not yet notified), with lifeline excluded from adjustments as the decisions state. It is labelled as an estimate that excludes fixed charges and taxes and depends on the household's slab, and it names its S.R.O. references.
- **No appliance wattage presets.** Users read the wattage from the rating label; the site does not publish "typical" watts.
- **AC:** power is entered in W or kW of *input* power. Tons and BTU/h are not converted, because they measure cooling capacity. No inverter saving is assumed. "Time at rated power" defaults to 100%, which the result labels a full-power estimate.
- **Validation** (`src/lib/energy/parse.ts`, `validate.ts`):
  - Plain decimals only. Commas are allowed; exponents, words and Infinity are rejected.
  - Negative values get their own message.
  - Ranges: watts > 0 and ≤ 100,000; kW > 0 and ≤ 100; quantity 1–100 whole; hours 0–24; days per month 1–31 whole; rate > 0 and ≤ 1,000; readings 0–99,999,999; billing days 1–62 whole; time at rated power > 0 and ≤ 100.
- **Rounding** (display only):
  - kWh: 2 decimals below 10, 1 decimal below 1,000, otherwise whole.
  - Cost: whole rupees, or paisa below Rs. 10.
  - Labels read "Estimated monthly cost".
- **Analytics**: `tool_selected` (tool and where it was chosen), `calculator_started` and `calculator_completed` (tool and outcome only). No inputs, results or rates are ever sent.

## Time-of-use bill calculator (Phase 6)

`/tou-electricity-bill-calculator` estimates A-1(b) and A-2(c) bills from peak units, off-peak units, sanctioned load (≥ 5 kW) and an optional MDI. Formula, sources and verification are in [CALCULATION.md](CALCULATION.md#time-of-use-phase-6). Tests: `tests/tou.test.ts` (hand-checked figures, validation, data validation) and `tests/tou-ui.test.tsx`.

## Deferred

- **Solar calculators.** See [SOLAR-RESEARCH.md](SOLAR-RESEARCH.md) for what was verified and what is still missing.
