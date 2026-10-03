import type { SourceDocument } from "../types";

/**
 * Official documents used by the tariff data. Every document was downloaded
 * from nepra.org.pk and read on 2026-10-01. Figures were transcribed from the
 * pages noted in `location`.
 */
const NEPRA = "National Electric Power Regulatory Authority (NEPRA)";
const MOE = "Ministry of Energy (Power Division), Government of Pakistan";
const BASE = "https://nepra.org.pk/tariff/Tariff";

export const sourceDocuments: readonly SourceDocument[] = [
  {
    id: "sro-279-2026",
    kind: "uniform-tariff",
    appliesTo: "all",
    reference: "S.R.O. 279(I)/2026",
    title:
      "Notification of NEPRA’s decision dated 11 February 2026 on the Federal Government’s motion and policy guidelines for rationalization of tariff of XWDISCOs and K-Electric",
    publisher: MOE,
    publishedOn: "2026-02-12",
    url: `${BASE}/Notifications/2026/02%20Feb/S.R.O.%20279(1)2026%20dated%2012-02-2026.pdf`,
    location:
      "Annex-A-1 (PDF page 15) and Annex-C for K-Electric (PDF pages 20–21): slab, time-of-use and fixed-charge rates; Annex-C Note 2 and the Annex-A-1 notes: fixed-charge basis for time-of-use connections",
    effectiveFrom: "2026-02-12",
  },
  {
    id: "sro-41-2026",
    kind: "provider-notification",
    appliesTo: ["fesco"],
    reference: "S.R.O. 41(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Faisalabad Electric Supply Company (FESCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2041(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 43–44); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-42-2026",
    kind: "provider-notification",
    appliesTo: ["gepco"],
    reference: "S.R.O. 42(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Gujranwala Electric Power Company (GEPCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2042(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 125–126); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-44-2026",
    kind: "provider-notification",
    appliesTo: ["hesco"],
    reference: "S.R.O. 44(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Hyderabad Electric Supply Company (HESCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2044(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 100–101); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-45-2026",
    kind: "provider-notification",
    appliesTo: ["iesco"],
    reference: "S.R.O. 45(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Islamabad Electric Supply Company (IESCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2045(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 43–44); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-47-2026",
    kind: "provider-notification",
    appliesTo: ["mepco"],
    reference: "S.R.O. 47(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Multan Electric Power Company (MEPCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2047(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 136–137); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-48-2026",
    kind: "provider-notification",
    appliesTo: ["pesco"],
    reference: "S.R.O. 48(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Peshawar Electric Supply Company (PESCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2048(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 143–144); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-49-2026",
    kind: "provider-notification",
    appliesTo: ["qesco"],
    reference: "S.R.O. 49(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Quetta Electric Supply Company (QESCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2049(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 102–103); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-50-2026",
    kind: "provider-notification",
    appliesTo: ["sepco"],
    reference: "S.R.O. 50(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Sukkur Electric Power Company (SEPCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2050(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 104–105); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-51-2026",
    kind: "provider-notification",
    appliesTo: ["tesco"],
    reference: "S.R.O. 51(I)/2026",
    title: "Notification of the Schedule of Electricity Tariffs for Tribal Areas Electricity Supply Company (TESCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2051(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification para 4 (in force from 1 January 2026); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions and time-of-use eligibility (PDF pages 108–109); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-52-2026",
    kind: "provider-notification",
    appliesTo: ["ke"],
    reference: "S.R.O. 52(I)/2026",
    title: "Notification substituting the GoP Applicable Tariff (Annex-C) for K-Electric, effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2052(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification paras 2–4: Annex-C substituted, other terms and conditions of S.R.O. 575(I)/2019 (as amended) continue, in force from 1 January 2026; later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-43-2026",
    kind: "provider-notification",
    appliesTo: ["hazeco"],
    reference: "S.R.O. 43(I)/2026",
    title:
      "Notification of the Schedule of Electricity Tariffs for Hazara Electric Supply Company (HAZECO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2043(1)2026%20dated%2013.01.2026.pdf`,
    location: "Notification (PDF page 1) and uniform annexes (PDF pages 15–22); Annex-V Part-I item 10 peak hours and Part-II A-1 definitions (PDF pages 104–105); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-46-2026",
    kind: "provider-notification",
    appliesTo: ["lesco"],
    reference: "S.R.O. 46(I)/2026",
    title:
      "Notification of the Schedule of Electricity Tariffs for Lahore Electric Supply Company (LESCO), effective 1 January 2026",
    publisher: MOE,
    publishedOn: "2026-01-13",
    url: `${BASE}/Notifications/2026/01%20Jan/S.R.O.%2046(1)2026%20dated%2013.01.2026.pdf`,
    location:
      "Notification (PDF page 1); Annex-V Part-I item 10 peak hours (PDF page 43); Part-II A-1 and A-2 consumer definitions and time-of-use eligibility (PDF pages 44–45, definitions in the same wording as K-Electric’s S.R.O. 1643(I)/2026); later modified by S.R.O. 279(I)/2026",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sro-1643-2026",
    kind: "regulatory-decision",
    appliesTo: ["ke"],
    reference: "S.R.O. 1643(I)/2026",
    title:
      "Notification of NEPRA’s decision on motions for leave for review against K-Electric’s supply tariff determination, including terms and conditions of supply",
    publisher: NEPRA,
    publishedOn: "2026-09-23",
    url: `${BASE}/Notifications/2026/09%20Sep/SRO%201643(I)-2026%20Dated%2023-09-2026.PDF`,
    location:
      "Notification para 3 (K-Electric consumers are charged the XWDISCO tariff); annexed terms and conditions Part-I item 10 (peak hours) and Part-II A-1 definitions",
  },
  {
    id: "fca-2026-07",
    kind: "fca",
    appliesTo: "all",
    reference: "S.R.O. 1499(I)/2026",
    title: "Decision of the Authority in the matter of Fuel Charges Adjustment for the month of July 2026 for Ex-WAPDA DISCOs",
    publisher: NEPRA,
    publishedOn: "2026-09-04",
    url: `${BASE}/Ex-WAPDA%20DISCOS/2026/TRF-100%20MFPA%20FOR%20THE%20MONTH%20OF%20JULY%202026%20EX-WAPDA%20DISCOS%2004-09-2026%2018342-60.PDF`,
    location: "Decision para 4",
  },
  {
    id: "fca-2026-06",
    kind: "fca",
    appliesTo: "all",
    reference: "S.R.O. 1336(I)/2026",
    title: "Decision of the Authority in the matter of Fuel Charges Adjustment for the month of June 2026 for XWDISCOs",
    publisher: NEPRA,
    publishedOn: "2026-08-07",
    url: `${BASE}/Ex-WAPDA%20DISCOS/2026/TRF-100%20XWDISCOS%20FCA%20JUN%202026%2007-08-2026%2017536-54.pdf`,
    location: "Decision para 4",
  },
  {
    id: "qta-2026-q2",
    kind: "qta",
    appliesTo: "all",
    reference: "S.R.O. 1501(I)/2026",
    title: "Decision of the Authority on requests by XWDISCOs for periodic adjustment in tariff for the 2nd quarter of CY 2026",
    publisher: NEPRA,
    publishedOn: "2026-09-07",
    url: `${BASE}/Notifications/2026/09%20Sep/SRO%201501(I)-2026%20Dated%2007-09-2026.pdf`,
    location: "Notification paras 2–3",
  },
  {
    id: "qta-2026-q1",
    kind: "qta",
    appliesTo: "all",
    reference: "S.R.O. 953(I)/2026",
    title: "Decision of the Authority on requests by XWDISCOs for periodic adjustment in tariff for the 1st quarter of CY 2026",
    publisher: NEPRA,
    publishedOn: "2026-06-08",
    url: `${BASE}/Notifications/2026/06%20June/SRO%20953(I)2026%20-%20Notification%20regarding%201st%20Quarter%20CY%202026%20XW-DISCOs%2008.06.2026.PDF`,
    location: "Notification paras 2–3",
  },
];

const byId = new Map(sourceDocuments.map((doc) => [doc.id, doc]));

export function getSourceDocument(id: string): SourceDocument | undefined {
  return byId.get(id);
}
