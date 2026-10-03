import { describe, it } from "node:test";
import { eachValue, expect } from "./support/expect";
import { PROVIDER_IDS } from "@/data/providers";
import { estimateTou, touProviders, type TouInput, type TouResult } from "@/lib/calculator/tou";
import { adjustmentData, sourceDocuments, tariffSchedules, validateTariffDataset, type TariffDataset } from "@/lib/tariffs";

const input = (o: Partial<TouInput> = {}): TouInput => ({
  providerId: "lesco",
  categoryId: "residential",
  billingMonth: "2026-10",
  peakUnits: 200,
  offPeakUnits: 800,
  sanctionedLoadKw: 6,
  mdiKw: null,
  ...o,
});

function ok(o: Partial<TouInput> = {}): TouResult {
  const outcome = estimateTou(input(o));
  if (outcome.status !== "success") throw new Error(JSON.stringify(outcome));
  return outcome.result;
}
const line = (r: TouResult, id: string) => r.lines.find((l) => l.id === id)?.amount;

describe("TOU estimate (hand-checked against S.R.O. 279 Annex-A-1/Annex-C)", () => {
  it("residential, October 2026: QTA added, FCA not yet notified", () => {
    const r = ok();
    expect(line(r, "peak")).toBe(9370); // 200 × 46.85
    expect(line(r, "off-peak")).toBe(27624); // 800 × 34.53
    expect(line(r, "fixed")).toBe(2025); // 50% × 6 kW × 675
    expect(line(r, "qta-2026-q2")).toBe(519.4); // 1,000 × 0.5194
    expect(r.total).toBe(39538.4);
    expect(r.billingDemandKw).toBe(3);
    expect(r.pendingAdjustments.map((p) => p.kind)).toEqual(["fca"]);
    expect(r.pendingAdjustments[0].message).toMatch(/^Not yet notified/);
    expect(r.tariffReference).toBe("A-1(b)");
  });

  it("uses MDI when it is higher than the sanctioned-load share", () => {
    const r = ok({ mdiKw: 4 });
    expect(r.billingDemandBasis).toBe("mdi");
    expect(line(r, "fixed")).toBe(2700);
    expect(r.total).toBe(40213.4);
  });

  it("ignores a lower MDI", () => {
    const r = ok({ mdiKw: 2 });
    expect(r.billingDemandBasis).toBe("sanctioned-load");
    expect(line(r, "fixed")).toBe(2025);
  });

  it("commercial, September 2026: FCA (July) and QTA both apply", () => {
    const r = ok({ categoryId: "commercial", billingMonth: "2026-09", peakUnits: 300, offPeakUnits: 1200, sanctionedLoadKw: 10 });
    expect(line(r, "peak")).toBe(13146); // 300 × 43.82
    expect(line(r, "off-peak")).toBe(42180); // 1,200 × 35.15
    expect(line(r, "fixed")).toBe(3125); // 25% × 10 kW × 1,250
    expect(line(r, "fca-2026-07")).toBe(3087.15); // 1,500 × 2.0581
    expect(line(r, "qta-2026-q2")).toBe(779.1); // 1,500 × 0.5194
    expect(r.total).toBe(62317.25);
    expect(r.pendingAdjustments).toHaveLength(0);
    expect(r.tariffReference).toBe("A-2(c)");
  });

  it("August 2026: negative QTA is a credit", () => {
    const r = ok({ billingMonth: "2026-08" });
    expect(line(r, "fca-2026-06")).toBe(750.3);
    expect(line(r, "qta-2026-q1")).toBe(-1985.7);
    expect(r.total).toBe(37783.6);
  });

  it("rounds a fractional billing demand once, to the paisa", () => {
    const r = ok({ categoryId: "commercial", sanctionedLoadKw: 5.01 });
    expect(r.billingDemandKw).toBe(1.2525);
    expect(line(r, "fixed")).toBe(1565.63); // 1.2525 × 1,250 = 1,565.625
  });

  it("total is the sum of its lines; 0 units still pays fixed charges", () => {
    const r = ok({ peakUnits: 0, offPeakUnits: 0 });
    expect(r.total).toBe(2025);
    expect(r.effectiveCostPerUnit).toBeNull();
    const big = ok({ peakUnits: 12345, offPeakUnits: 67890, mdiKw: 9.87 });
    expect(big.total).toBe(Math.round(big.lines.reduce((s, l) => s + l.amount * 100, 0)) / 100);
  });

  eachValue(PROVIDER_IDS)("%s has the verified TOU tariff", (providerId) => {
    expect(ok({ providerId }).total).toBe(39538.4);
  });

  it("peak hours: each provider's from its own document; K-Electric's differ", () => {
    const schedule = tariffSchedules[0];
    const hours = schedule.peakHours ?? [];
    expect(hours.map((h) => h.providerId).sort()).toEqual([...PROVIDER_IDS].sort());
    for (const h of hours) {
      expect(schedule.providerSourceIds?.[h.providerId]).toContain(h.sourceId);
      expect(h.periods.map((p) => p.peak)).toEqual(
        h.providerId === "ke"
          ? ["6:30 PM to 10:30 PM", "6 PM to 10 PM"]
          : ["5 PM to 9 PM", "6 PM to 10 PM", "7 PM to 11 PM", "6 PM to 10 PM"],
      );
    }
    expect(hours.find((h) => h.providerId === "ke")?.sourceId).toBe("sro-1643-2026");
  });

  it("sources: shared notification plus the provider's own only", () => {
    const refs = (id: TouInput["providerId"]) => ok({ providerId: id }).tariff.sources.map((s) => s.reference);
    expect(refs("hazeco")).toEqual(["S.R.O. 279(I)/2026", "S.R.O. 43(I)/2026"]);
    expect(refs("iesco")).toEqual(["S.R.O. 279(I)/2026", "S.R.O. 45(I)/2026"]);
    expect(refs("ke")).toEqual(["S.R.O. 279(I)/2026", "S.R.O. 52(I)/2026", "S.R.O. 1643(I)/2026"]);
  });
});

describe("TOU validation", () => {
  const errorsFor = (o: Partial<TouInput>) => {
    const outcome = estimateTou(input(o));
    return outcome.status === "invalid" ? outcome.errors : {};
  };

  it("requires 5 kW or more", () => {
    expect(errorsFor({ sanctionedLoadKw: 4.99 }).sanctionedLoadKw).toMatch(/5 kW or more/);
    expect(errorsFor({ sanctionedLoadKw: 5 }).sanctionedLoadKw).toBe(undefined);
  });

  it("rejects bad units, load decimals and MDI", () => {
    expect(errorsFor({ peakUnits: -1 }).peakUnits).toMatch(/whole number/);
    expect(errorsFor({ offPeakUnits: 1.5 }).offPeakUnits).toMatch(/whole number/);
    expect(errorsFor({ sanctionedLoadKw: 6.123 }).sanctionedLoadKw).toMatch(/2 decimal/);
    expect(errorsFor({ mdiKw: -1 }).mdiKw).toMatch(/MDI/);
    expect(errorsFor({ sanctionedLoadKw: 5001 }).sanctionedLoadKw).toMatch(/5,000 kW/);
  });

  it("rejects an unsupported bill month", () => {
    expect(errorsFor({ billingMonth: "2026-12" }).billingMonth).toMatch(/bill month/);
  });

  it("every provider is covered", () => {
    expect([...touProviders()].sort()).toEqual([...PROVIDER_IDS].sort());
  });
});

describe("TOU tariff data validation", () => {
  const clone = () =>
    structuredClone({ schedules: tariffSchedules, adjustments: adjustmentData, sources: sourceDocuments }) as TariffDataset;
  type Mutable = { timeOfUse: { peakRatePerUnit: number; billingDemand: { sanctionedLoadShare: number; sourceId: string } }[] };

  it("the live data is valid", () => {
    expect(validateTariffDataset(clone())).toEqual([]);
  });

  it("rejects a zero rate, a share above 100% and an unknown source", () => {
    const d = clone();
    const tou = (d.schedules[0] as unknown as Mutable).timeOfUse;
    tou[0].peakRatePerUnit = 0;
    tou[1].billingDemand.sanctionedLoadShare = 1.5;
    tou[1].billingDemand.sourceId = "nope";
    const errors = validateTariffDataset(d).join("\n");
    expect(errors).toMatch(/invalid peakRatePerUnit/);
    expect(errors).toMatch(/sanctionedLoadShare/);
    expect(errors).toMatch(/unknown source nope/);
  });
});
