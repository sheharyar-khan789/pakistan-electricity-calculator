# Solar research record

Status: **research only. Decision (Phase 7, 2026-10-03): DEFER.** No solar calculator or solar content is published.

**Re-checked in Phase 8 (2026-10-03):** NEPRA's legislation page lists no amendment after S.R.O. 1330(I)/2026, and no notified figure for the national average energy purchase price was found. The decision is unchanged.

## Current rules, from official NEPRA documents

All four documents are listed under "NEPRA (Prosumer) Regulations, 2026" on <https://nepra.org.pk/Legal.php> and were read in full.

### S.R.O. 251(I)/2026, 9 February 2026: the regulations
[PDF](https://nepra.org.pk/Legislation/3-Reg/3.35%20NEPRA%20%20Prosumer%20Regulations%202026/NEPRA%20Prosumer%20Regulations%20(SRO%20251(I)2026)%2009-02-26.PDF)

| Topic | Rule | Where |
|---|---|---|
| Commencement | In force at once; the 2015 net-metering regulations are repealed | reg. 1(2), 21(1) |
| Facility | Solar, wind or biogas, up to 1 MW | reg. 2(1)(ix) |
| Capacity | Not above the applicant's sanctioned load (NEPRA may revise); load-flow study at 250 kW and above; no new applications once a transformer's DG capacity reaches 80% of its rating | reg. 3(2), 3(3), 3(5) |
| Applicants | 3-phase 400 V or 11 kV consumers of any category | reg. 2(1)(v) |
| Billing cycle | 30 days | reg. 2(1)(viii) |
| Imports | Billed at the applicable tariff | reg. 14(1)(a) |
| Exports | Credited at the **national average energy purchase price** (net billing) | reg. 14(1)(b) |
| Net credit | Carried to the next cycle or paid quarterly | reg. 14(2) |
| Export rate revision | NEPRA may revise it by notification during an agreement | reg. 14(3) |
| Agreement | 5 years, renewable by mutual consent | reg. 7 |

### S.R.O. 547(I)/2026, 2 April 2026: existing prosumers
[PDF](https://nepra.org.pk/Legislation/3-Reg/3.35%20NEPRA%20%20Prosumer%20Regulations%202026/S.R.O%20547(1)%202026%20notification%20amendment%20in%20NEPRA%20(Prosumer)%20Regulations%2002-04-2026.PDF)

- Substitutes reg. 21(2), deemed effective from 9 Feb 2026.
- Agreements made under the 2015 regulations are billed at **"the rate and mechanism provided in the repealed regulations"** until their term expires.
- That protection ends on a material modification that changes the facility's maximum output.

(This replaces the original reg. 21(2), which billed existing agreements at the national average *power* purchase price.)

### S.R.O. 709(I)/2026, 28 April 2026: fees
[PDF](https://nepra.org.pk/Legislation/3-Reg/3.35%20NEPRA%20%20Prosumer%20Regulations%202026/SRO%20709%20-%20Fee%20for%20Prosumers%2028-04-2026.PDF)

The concurrence fee is nil for 25 kW or less, and Rs 1,000 per kW (one-time) above 25 kW, effective from 9 Feb 2026.

### S.R.O. 1330(I)/2026, 6 August 2026: approval route
[PDF](https://nepra.org.pk/Legislation/3-Reg/3.35%20NEPRA%20%20Prosumer%20Regulations%202026/SRO%201330(I)-2026%20Dated%2006-08-2026.pdf)

- Facilities of **25 kW or below** don't need NEPRA concurrence; the distribution company gives approval instead.
- Consequential "or approval" wording is added to regs 3(11) and 4(4) and to the Schedule-I agreement.
- **No billing or rate change.**

## Why the calculator is still deferred

1. **Export rate.** No officially notified figure for the national average *energy* purchase price was found on nepra.org.pk.
   - NEPRA's power purchase price forecast decisions deal with the national average *power* purchase price. That figure was seen only in a search snippet, not read here, and is a different quantity: the basis the original reg. 21(2) applied to existing agreements before S.R.O. 547 replaced it.
   - Press and solar-company figures of Rs 11–13 are not used.
2. **Generation.** No defensible irradiance or generation dataset has been chosen. No "X sunlight hours" constant may be hard-coded.
3. **Inputs a partial tool would need from the user:**
   - export rate;
   - monthly generation;
   - imported and exported units;
   - for existing prosumers, the old net-metering terms, which are not modelled.

   With all of these user-supplied, the tool would only multiply the user's own numbers, and the regulator can revise the export rate mid-agreement (reg. 14(3)).
4. **No search evidence.** No Search Console data exists to show demand for such a page.

## What would change the decision

- **Export rate:** NEPRA notifies the national average energy purchase price as a figure, with an effective date. Record it as a source with `kind` for its document type.
- **Generation:** a documented generation source with location, irradiation, performance ratio and degradation, or a design where the user enters measured generation, labelled as such.
- **Demand:** Search Console data showing solar-billing demand that existing pages don't answer.

Even then, a user-entered export rate must be labelled **"User-entered export rate"**, never "official".
