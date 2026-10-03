import type { ProviderId } from "@/data/providers";

/**
 * Providers whose consumer-end tariff was verified to be the uniform
 * GoP-applicable schedule (S.R.O. 279(I)/2026 and S.R.O. 1643(I)/2026).
 *
 * HAZECO was verified separately on 2026-10-01: S.R.O. 43(I)/2026 substitutes
 * its Schedule of Electricity Tariffs with the same uniform annexes, S.R.O.
 * 279(I)/2026 modifies S.R.O. 41–52 (43 included), and the FCA/QTA decisions
 * name HAZECO. S.R.O. 1208(I)/2026 (its distribution-margin review) defers
 * differences to a later rebasing, so consumer-end rates are unchanged.
 */
export const UNIFORM_TARIFF_PROVIDERS: readonly ProviderId[] = [
  "lesco",
  "iesco",
  "mepco",
  "fesco",
  "gepco",
  "pesco",
  "hesco",
  "sepco",
  "qesco",
  "tesco",
  "hazeco",
  "ke",
];
