import type { AdjustmentDataset } from "../types";
import { UNIFORM_TARIFF_PROVIDERS } from "./coverage";

/**
 * Periodic adjustments, kept separate from the base tariff.
 *
 * FCA decisions state: "XWDISCOs and KE shall reflect the FCA in respect of
 * <month> in the billing month of <month + 2>" and that it is charged "on the
 * basis of units billed to the consumers in the month of <month>".
 *
 * QTA decisions state the rate is "applicable to all consumer categories,
 * except lifeline consumers, units billed for incremental consumption
 * package, and prepaid consumers", and also apply to K-Electric consumers.
 *
 * To add a month: append its decision here (with its source in sources.ts),
 * then add the bill month to `supportedBillingMonths`.
 */
export const adjustmentData: AdjustmentDataset = {
  supportedBillingMonths: ["2026-08", "2026-09", "2026-10", "2026-11"],
  expectedKinds: ["fca", "qta"],
  fcaBillingLagMonths: 2,
  lastVerifiedOn: "2026-10-01",
  adjustments: [
    {
      id: "fca-2026-06",
      kind: "fca",
      label: "Fuel charges adjustment (June 2026)",
      ratePerUnit: 0.7503,
      billingMonths: ["2026-08"],
      providers: UNIFORM_TARIFF_PROVIDERS,
      categories: ["residential", "commercial", "industrial", "agricultural"],
      excludedBandIds: ["lifeline"],
      basis: { kind: "units-of-month", month: "2026-06" },
      decidedOn: "2026-08-07",
      lastVerifiedOn: "2026-10-01",
      sourceId: "fca-2026-06",
      applicability:
        "Applicable to all consumer categories of KE and XWDISCOs, except lifeline consumers, Electric Vehicle Charging Stations (EVCS) and pre-paid consumers; reflected in the billing month of August 2026 on units billed in June 2026.",
    },
    {
      id: "fca-2026-07",
      kind: "fca",
      label: "Fuel charges adjustment (July 2026)",
      ratePerUnit: 2.0581,
      billingMonths: ["2026-09"],
      providers: UNIFORM_TARIFF_PROVIDERS,
      categories: ["residential", "commercial", "industrial", "agricultural"],
      excludedBandIds: ["lifeline"],
      basis: { kind: "units-of-month", month: "2026-07" },
      decidedOn: "2026-09-04",
      lastVerifiedOn: "2026-10-01",
      sourceId: "fca-2026-07",
      applicability:
        "Applicable to all consumer categories of KE and XWDISCOs, except lifeline consumers, Electric Vehicle Charging Stations (EVCS) and pre-paid consumers; reflected in the billing month of September 2026 on units billed in July 2026.",
    },
    {
      id: "qta-2026-q1",
      kind: "qta",
      label: "Quarterly tariff adjustment (Q1 CY 2026)",
      ratePerUnit: -1.9857,
      billingMonths: ["2026-06", "2026-07", "2026-08"],
      providers: UNIFORM_TARIFF_PROVIDERS,
      categories: ["residential", "commercial", "industrial", "agricultural"],
      excludedBandIds: ["lifeline"],
      basis: { kind: "current-bill" },
      decidedOn: "2026-06-04",
      lastVerifiedOn: "2026-10-01",
      sourceId: "qta-2026-q1",
      applicability:
        "Negative adjustment provided in June, July and August 2026 at a uniform rate of Rs. 1.9857/kWh to all consumer categories, except lifeline consumers, units billed for incremental consumption package and prepaid consumers; also applied to K-Electric consumers.",
    },
    {
      id: "qta-2026-q2",
      kind: "qta",
      label: "Quarterly tariff adjustment (Q2 CY 2026)",
      ratePerUnit: 0.5194,
      billingMonths: ["2026-09", "2026-10", "2026-11"],
      providers: UNIFORM_TARIFF_PROVIDERS,
      categories: ["residential", "commercial", "industrial", "agricultural"],
      excludedBandIds: ["lifeline"],
      basis: { kind: "current-bill" },
      decidedOn: "2026-09-04",
      lastVerifiedOn: "2026-10-01",
      sourceId: "qta-2026-q2",
      applicability:
        "Positive adjustment billed September to November 2026 at a uniform rate of Rs. 0.5194/kWh to all consumer categories, except lifeline consumers, units billed for incremental consumption package and prepaid consumers; also applied to K-Electric consumers.",
    },
  ],
};
