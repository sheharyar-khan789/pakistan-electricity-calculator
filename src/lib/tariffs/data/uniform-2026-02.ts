import type { TariffSchedule } from "../types";
import { UNIFORM_TARIFF_PROVIDERS } from "./coverage";

/**
 * Uniform consumer-end tariff ("GoP applicable" rates) for XWDISCOs and
 * K-Electric, as modified by S.R.O. 279(I)/2026 with effect from
 * 12 February 2026.
 *
 * Transcribed from:
 * - Annex-A-1, column D "GoP applicable variable charges" and column B
 *   "Fixed charges Rs/kW/M" (PDF page 15), and
 * - Annex-C "GoP Applicable Schedule of Tariff for K-Electric Consumers"
 *   (PDF pages 20–21), which carries identical figures.
 *
 * S.R.O. 279(I)/2026 modifies S.R.O.s 41(I)/2026 to 52(I)/2026 (13 January
 * 2026) "in respect of XWDISCO’s and K-Electric". S.R.O. 1643(I)/2026
 * (23 September 2026) confirms K-Electric consumers are charged the tariff
 * applicable to XWDISCO consumers.
 *
 * Only the parts this calculator models are transcribed: residential A-1(a)
 * and commercial A-2(a), i.e. sanctioned load below 5 kW, non-time-of-use.
 */
const XWDISCO_PEAK_PERIODS = [
  { months: "December to February", peak: "5 PM to 9 PM" },
  { months: "March to May", peak: "6 PM to 10 PM" },
  { months: "June to August", peak: "7 PM to 11 PM" },
  { months: "September to November", peak: "6 PM to 10 PM" },
] as const;
const XWDISCO_PEAK_NOTE = "Off-peak is the remaining 20 hours of the day. Peak timing is to be adjusted in case of daylight saving.";

export const uniformSchedule2026Feb: TariffSchedule = {
  id: "pk-uniform-gop-2026-02-12",
  title: "Uniform GoP applicable tariff (rationalized), effective 12 February 2026",
  providers: UNIFORM_TARIFF_PROVIDERS,
  effectiveFrom: "2026-02-12",
  effectiveTo: null,
  firstBillingMonth: "2026-02",
  lastBillingMonth: null,
  lastVerifiedOn: "2026-10-01",
  sourceIds: ["sro-279-2026"],
  providerSourceIds: {
    // Each company's own notification of the schedule that S.R.O. 279 modifies
    // (S.R.O. 41–52 of 13 January 2026). All twelve were read on 2026-10-03.
    fesco: ["sro-41-2026"],
    gepco: ["sro-42-2026"],
    hazeco: ["sro-43-2026"],
    hesco: ["sro-44-2026"],
    iesco: ["sro-45-2026"],
    lesco: ["sro-46-2026"],
    mepco: ["sro-47-2026"],
    pesco: ["sro-48-2026"],
    qesco: ["sro-49-2026"],
    sepco: ["sro-50-2026"],
    tesco: ["sro-51-2026"],
    // K-Electric: its Annex-C notification, and S.R.O. 1643 confirming its
    // consumers are charged the XWDISCO tariff.
    ke: ["sro-52-2026", "sro-1643-2026"],
  },
  categories: [
    {
      categoryId: "residential",
      sanctionedLoadBelowKw: 5,
      defaultBandId: "unprotected",
      notes: [
        "As per Authority’s decision only protected residential consumers will be given the benefit of one previous slab.",
        "As per Authority’s decision, residential life line consumer will not be given any slab benefit.",
        "The fixed charges for Non-ToU domestic consumers shall be applicable based on the sanctioned load.",
        "Under tariff A-1, there shall be minimum monthly customer charge even if no energy is consumed (Rs. 75 single phase, Rs. 150 three phase). For consumers where monthly fixed charges are applicable, no minimum charges shall be applicable.",
      ],
      bands: [
        {
          id: "unprotected",
          label: "Un-protected (standard)",
          description: "Most homes. All units are charged at the rate of the slab your total falls in.",
          tariffReference: "A-1(a)",
          pricing: "single-slab",
          fixedCharge: { kind: "per-sanctioned-kw-by-slab" },
          slabs: [
            { fromUnits: 0, toUnits: 100, ratePerUnit: 22.44, fixedChargePerKwPerMonth: 275 },
            { fromUnits: 101, toUnits: 200, ratePerUnit: 28.91, fixedChargePerKwPerMonth: 300 },
            { fromUnits: 201, toUnits: 300, ratePerUnit: 33.1, fixedChargePerKwPerMonth: 350 },
            { fromUnits: 301, toUnits: 400, ratePerUnit: 36.46, fixedChargePerKwPerMonth: 400 },
            { fromUnits: 401, toUnits: 500, ratePerUnit: 38.95, fixedChargePerKwPerMonth: 500 },
            { fromUnits: 501, toUnits: 600, ratePerUnit: 40.22, fixedChargePerKwPerMonth: 675 },
            { fromUnits: 601, toUnits: 700, ratePerUnit: 41.85, fixedChargePerKwPerMonth: 675 },
            { fromUnits: 701, toUnits: null, ratePerUnit: 47.2, fixedChargePerKwPerMonth: 675 },
          ],
          eligibility: {
            text: "Residential Non-ToU consumers not falling under the protected category would be categorized under ‘Un-protected consumer category’.",
            sourceId: "sro-46-2026",
          },
        },
        {
          id: "protected",
          label: "Protected",
          description: "Homes that used 200 units or less every month for the past 6 months. One previous slab benefit applies.",
          tariffReference: "A-1(a)",
          pricing: "one-previous-slab-benefit",
          fixedCharge: { kind: "per-sanctioned-kw-by-slab" },
          maxUnits: 200,
          slabs: [
            { fromUnits: 0, toUnits: 100, ratePerUnit: 10.54, fixedChargePerKwPerMonth: 200 },
            { fromUnits: 101, toUnits: 200, ratePerUnit: 13.01, fixedChargePerKwPerMonth: 300 },
          ],
          eligibility: {
            text: "“Protected consumers” mean Non-ToU residential consumers consuming up to 200 kWh per month consistently for the past 6 months.",
            sourceId: "sro-46-2026",
          },
        },
        {
          id: "lifeline",
          label: "Lifeline",
          description: "Single-phase homes with a sanctioned load up to 1 kW using 100 units or less. No fixed charges.",
          tariffReference: "A-1(a)",
          pricing: "single-slab",
          fixedCharge: { kind: "none" },
          minimumCharge: { singlePhasePerMonth: 75, threePhasePerMonth: 150 },
          maxUnits: 100,
          maxSanctionedLoadKw: 1,
          phase: "single",
          slabs: [
            { fromUnits: 0, toUnits: 50, ratePerUnit: 3.95 },
            { fromUnits: 51, toUnits: 100, ratePerUnit: 7.74 },
          ],
          eligibility: {
            text: "“Life Line Consumer” means those residential consumers having single phase electric connection with a sanctioned load up to 1 kW … having maximum of last twelve months and current month’s consumption up to 100 units.",
            sourceId: "sro-46-2026",
          },
        },
      ],
    },
    {
      categoryId: "commercial",
      sanctionedLoadBelowKw: 5,
      defaultBandId: "commercial-under-5kw",
      notes: ["A-2(a) applies for sanctioned load less than 5 kW: fixed charges of Rs. 1,000 per consumer per month."],
      bands: [
        {
          id: "commercial-under-5kw",
          label: "Commercial, sanctioned load below 5 kW",
          description: "Shops and offices with a sanctioned load below 5 kW.",
          tariffReference: "A-2(a)",
          pricing: "single-slab",
          fixedCharge: { kind: "per-consumer", amountPerMonth: 1000 },
          slabs: [{ fromUnits: 0, toUnits: null, ratePerUnit: 37.44 }],
        },
      ],
    },
  ],
  timeOfUse: [
    {
      id: "residential-tou",
      categoryId: "residential",
      label: "Residential time of use",
      tariffReference: "A-1(b)",
      minSanctionedLoadKw: 5,
      peakRatePerUnit: 46.85,
      offPeakRatePerUnit: 34.53,
      fixedChargePerKwPerMonth: 675,
      billingDemand: {
        sanctionedLoadShare: 0.5,
        text: "The fixed charges for ToU domestic consumers shall be applicable based on 50% of the sanctioned load or MDI, whichever is higher.",
        sourceId: "sro-279-2026",
      },
      eligibility: {
        text: "All new consumers having sanctioned load 5 kW and above shall be provided T.O.U metering arrangement and shall be billed on the basis of A-1(b) as set out in the Schedule of Tariff.",
        sourceId: "sro-46-2026",
      },
    },
    {
      id: "commercial-tou",
      categoryId: "commercial",
      label: "Commercial time of use",
      tariffReference: "A-2(c)",
      minSanctionedLoadKw: 5,
      peakRatePerUnit: 43.82,
      offPeakRatePerUnit: 35.15,
      fixedChargePerKwPerMonth: 1250,
      billingDemand: {
        sanctionedLoadShare: 0.25,
        text: "Where fixed charges are applicable Rs./kW/Month, the charges shall be billed based on 25% of sanctioned load or actual MDI for the month, whichever is higher.",
        sourceId: "sro-279-2026",
      },
      eligibility: {
        text: "Consumers under tariff A-2 having sanctioned load 5 kW and above are billed on A-2(b) until provided T.O.U metering; thereafter they are billed under A-2(c).",
        sourceId: "sro-46-2026",
      },
    },
  ],
  // Read in each company's own notification (Annex-V Part-I item 10); all eleven
  // ex-WAPDA companies state the same hours. K-Electric's differ: they are taken
  // from the terms annexed to S.R.O. 1643 (Part-I item 10), and K-Electric's own
  // tariff page (ke.com.pk/tariff-structure, read 2026-10-03) states the same.
  peakHours: [
    ...([["fesco", "sro-41-2026"], ["gepco", "sro-42-2026"], ["hazeco", "sro-43-2026"], ["hesco", "sro-44-2026"], ["iesco", "sro-45-2026"], ["lesco", "sro-46-2026"], ["mepco", "sro-47-2026"], ["pesco", "sro-48-2026"], ["qesco", "sro-49-2026"], ["sepco", "sro-50-2026"], ["tesco", "sro-51-2026"]] as const).map(
    ([providerId, sourceId]) => ({ providerId, sourceId, periods: XWDISCO_PEAK_PERIODS, note: XWDISCO_PEAK_NOTE }),
    ),
    {
      providerId: "ke",
      sourceId: "sro-1643-2026",
      periods: [
        { months: "April to October", peak: "6:30 PM to 10:30 PM" },
        { months: "November to March", peak: "6 PM to 10 PM" },
      ],
      note: "Off-peak is the remaining 20 hours of the day. Peak timing is to be adjusted in case of daylight saving. K-Electric’s own tariff page states the same hours.",
    },
  ],
};
