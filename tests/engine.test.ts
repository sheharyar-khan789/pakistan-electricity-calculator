import { describe, it } from "node:test";
import { each, eachValue, expect } from "./support/expect";
import { UNIFORM_TARIFF_PROVIDERS } from "@/lib/tariffs/data/coverage";
import { PROVIDER_IDS } from "@/data/providers";
import { line, run, success } from "./helpers";

/**
 * Expected figures are hand-computed from the official GoP applicable rates
 * in S.R.O. 279(I)/2026 (Annex-A-1 / Annex-C) and the adjustment decisions
 * listed in src/lib/tariffs/data. They are NOT copied from engine output.
 *
 * Bill months used:
 * - 2026-08: FCA June 2026 +0.7503, QTA Q1 −1.9857
 * - 2026-09: FCA July 2026 +2.0581, QTA Q2 +0.5194
 * - 2026-10: FCA pending,          QTA Q2 +0.5194
 */

describe("residential un-protected (single-slab pricing)", () => {
  // Each case: units, energy, fixed (2 kW × per-kW rate), QTA (+0.5194/unit), total.
  const cases: [number, number, number, number, number][] = [
    [0, 0, 550, 0, 550],
    [1, 22.44, 550, 0.52, 572.96],
    [99, 2221.56, 550, 51.42, 2822.98],
    [100, 2244, 550, 51.94, 2845.94],
    [101, 2919.91, 600, 52.46, 3572.37],
    [199, 5753.09, 600, 103.36, 6456.45],
    [200, 5782, 600, 103.88, 6485.88],
    [201, 6653.1, 700, 104.4, 7457.5],
    [299, 9896.9, 700, 155.3, 10752.2],
    [300, 9930, 700, 155.82, 10785.82],
    [301, 10974.46, 800, 156.34, 11930.8],
    [400, 14584, 800, 207.76, 15591.76],
    [401, 15618.95, 1000, 208.28, 16827.23],
    [500, 19475, 1000, 259.7, 20734.7],
    [501, 20150.22, 1350, 260.22, 21760.44],
    [600, 24132, 1350, 311.64, 25793.64],
    [601, 25151.85, 1350, 312.16, 26814.01],
    [700, 29295, 1350, 363.58, 31008.58],
    [701, 33087.2, 1350, 364.1, 34801.3],
  ];

  each(cases)("%i units → exact breakdown (October 2026)", async (units, energy, fixed, qta, total) => {
    const result = await success({ unitsConsumed: units });
    expect(line(result, "energy")).toBe(energy);
    expect(line(result, "fixed")).toBe(fixed);
    expect(line(result, "qta-2026-q2")).toBe(qta);
    expect(result.total).toBe(total);
  });

  it("charges every unit at the slab of the total (no slab benefit)", async () => {
    const result = await success({ unitsConsumed: 250 });
    expect(result.breakdown.slabs).toEqual([
      { fromUnits: 201, toUnits: 300, ratePerUnit: 33.1, unitsCharged: 250, amount: 8275 },
    ]);
  });

  it("scales fixed charges with fractional sanctioned load", async () => {
    const result = await success({ unitsConsumed: 250, sanctionedLoadKw: 2.75 });
    expect(line(result, "fixed")).toBe(962.5); // 2.75 kW × Rs. 350
  });

  it("handles very high consumption without overflow", async () => {
    const result = await success({ unitsConsumed: 1_000_000, sanctionedLoadKw: 4.99 });
    expect(line(result, "energy")).toBe(47_200_000);
    expect(line(result, "fixed")).toBe(3368.25); // 4.99 × 675
    expect(line(result, "qta-2026-q2")).toBe(519_400);
    expect(result.total).toBe(47_722_768.25);
  });

  it("reports the FCA for October 2026 as pending, not as zero", async () => {
    const result = await success();
    expect(result.breakdown.lines.some((l) => l.id.startsWith("fca"))).toBe(false);
    expect(result.pendingAdjustments).toHaveLength(1);
    expect(result.pendingAdjustments[0].kind).toBe("fca");
    expect(result.pendingAdjustments[0].message).toContain("August 2026");
  });
});

describe("residential protected (one previous slab benefit)", () => {
  it("1–100 units use the first slab only", async () => {
    const result = await success({ bandId: "protected", unitsConsumed: 100, sanctionedLoadKw: 1.5, billingMonth: "2026-09" });
    expect(line(result, "energy")).toBe(1054);
    expect(line(result, "fixed")).toBe(300); // 1.5 × 200
    expect(line(result, "fca-2026-07")).toBe(205.81);
    expect(line(result, "qta-2026-q2")).toBe(51.94);
    expect(result.total).toBe(1611.75);
  });

  it("101 units: first 100 at the previous slab rate, 1 at the current", async () => {
    const result = await success({ bandId: "protected", unitsConsumed: 101, sanctionedLoadKw: 1, billingMonth: "2026-09" });
    expect(result.breakdown.slabs).toEqual([
      { fromUnits: 0, toUnits: 100, ratePerUnit: 10.54, unitsCharged: 100, amount: 1054 },
      { fromUnits: 101, toUnits: 200, ratePerUnit: 13.01, unitsCharged: 1, amount: 13.01 },
    ]);
    expect(line(result, "fixed")).toBe(300);
  });

  it("150 units in September 2026 → exact total", async () => {
    const result = await success({ bandId: "protected", unitsConsumed: 150, sanctionedLoadKw: 1.5, billingMonth: "2026-09" });
    expect(line(result, "energy")).toBe(1704.5); // 100 × 10.54 + 50 × 13.01
    expect(line(result, "fixed")).toBe(450); // 1.5 × 300
    expect(line(result, "fca-2026-07")).toBe(308.72); // 150 × 2.0581 = 308.715 → half-up
    expect(line(result, "qta-2026-q2")).toBe(77.91);
    expect(result.total).toBe(2541.13);
  });

  it("200 units is still protected", async () => {
    const result = await success({ bandId: "protected", unitsConsumed: 200, sanctionedLoadKw: 1 });
    expect(line(result, "energy")).toBe(2355); // 1054 + 100 × 13.01
  });

  it("rejects 201 units for a protected consumer instead of guessing", async () => {
    const outcome = await run({ bandId: "protected", unitsConsumed: 201 });
    expect(outcome.status).toBe("invalid");
    if (outcome.status === "invalid") expect(outcome.errors.bandId).toMatch(/200 units/);
  });

  it("is cheaper than un-protected for the same units", async () => {
    const p = await success({ bandId: "protected", unitsConsumed: 150 });
    const u = await success({ bandId: "unprotected", unitsConsumed: 150 });
    expect(p.total).toBeLessThan(u.total);
  });
});

describe("residential lifeline", () => {
  it("50 units → Rs. 3.95/unit, no fixed charges, no FCA or QTA", async () => {
    const result = await success({ bandId: "lifeline", unitsConsumed: 50, sanctionedLoadKw: 1, billingMonth: "2026-09" });
    expect(line(result, "energy")).toBe(197.5);
    expect(result.breakdown.lines.map((l) => l.id)).toEqual(["energy"]);
    expect(result.total).toBe(197.5);
  });

  it("51 units → every unit at Rs. 7.74 (no slab benefit)", async () => {
    const result = await success({ bandId: "lifeline", unitsConsumed: 51, sanctionedLoadKw: 1 });
    expect(result.total).toBe(394.74);
  });

  it("applies the Rs. 75 minimum charge as a floor", async () => {
    const result = await success({ bandId: "lifeline", unitsConsumed: 10, sanctionedLoadKw: 0.5 });
    expect(line(result, "energy")).toBe(39.5);
    expect(line(result, "minimum-charge")).toBe(35.5);
    expect(result.total).toBe(75);
  });

  it("0 units still pays the minimum charge", async () => {
    const result = await success({ bandId: "lifeline", unitsConsumed: 0, sanctionedLoadKw: 1 });
    expect(result.total).toBe(75);
    expect(result.effectiveCostPerUnit).toBeNull();
  });

  it("rejects more than 100 units", async () => {
    const outcome = await run({ bandId: "lifeline", unitsConsumed: 101, sanctionedLoadKw: 1 });
    expect(outcome.status).toBe("invalid");
  });

  it("rejects sanctioned load above 1 kW", async () => {
    const outcome = await run({ bandId: "lifeline", unitsConsumed: 40, sanctionedLoadKw: 1.01 });
    expect(outcome.status).toBe("invalid");
    if (outcome.status === "invalid") expect(outcome.errors.bandId).toMatch(/1 kW/);
  });
});

describe("commercial below 5 kW", () => {
  it("300 units in August 2026 with a negative QTA → exact total", async () => {
    const result = await success({
      consumerCategoryId: "commercial",
      bandId: undefined,
      unitsConsumed: 300,
      sanctionedLoadKw: 3,
      billingMonth: "2026-08",
    });
    expect(line(result, "energy")).toBe(11232);
    expect(line(result, "fixed")).toBe(1000);
    expect(line(result, "fca-2026-06")).toBe(225.09);
    expect(line(result, "qta-2026-q1")).toBe(-595.71);
    expect(result.total).toBe(11861.38);
    expect(result.pendingAdjustments).toHaveLength(0);
  });
});

describe("sanctioned load and category limits", () => {
  it("4.99 kW is supported, 5 kW is time-of-use and unavailable", async () => {
    expect((await run({ sanctionedLoadKw: 4.99 })).status).toBe("success");
    const outcome = await run({ sanctionedLoadKw: 5 });
    expect(outcome.status).toBe("unavailable");
    if (outcome.status === "unavailable") expect(outcome.reason).toBe("load-not-supported");
  });

  eachValue([0, -1, 2.555, Number.NaN])("rejects sanctioned load %s", async (kw) => {
    expect((await run({ sanctionedLoadKw: kw })).status).toBe("invalid");
  });

  it("requires sanctioned load", async () => {
    expect((await run({ sanctionedLoadKw: undefined })).status).toBe("invalid");
  });

  eachValue(["industrial", "agricultural"] as const)("%s is reported as not supported", async (category) => {
    const outcome = await run({ consumerCategoryId: category });
    expect(outcome.status).toBe("unavailable");
    if (outcome.status === "unavailable") expect(outcome.reason).toBe("category-not-supported");
  });
});

describe("input validation inside the engine", () => {
  eachValue([-1, 1.5, Number.NaN, 1_000_001])("rejects units %s", async (units) => {
    expect((await run({ unitsConsumed: units })).status).toBe("invalid");
  });

  eachValue(["2026-07", "2026-12", "2025-10", "garbage"])("rejects unsupported bill month %s", async (month) => {
    const outcome = await run({ billingMonth: month });
    expect(outcome.status).not.toBe("success");
  });

  it("rejects an unknown consumer status", async () => {
    expect((await run({ bandId: "vip" })).status).toBe("invalid");
  });
});

describe("result structure and metadata", () => {
  it("is auditable: version, dates, sources, assumptions, exclusions", async () => {
    const result = await success({ billingMonth: "2026-09" });
    expect(result.taxesIncluded).toBe(false);
    expect(result.tariff.id).toBe("pk-uniform-gop-2026-02-12");
    expect(result.tariff.tariffReference).toBe("A-1(a)");
    expect(result.tariff.effectiveFrom).toBe("2026-02-12");
    expect(result.tariff.lastVerifiedOn).toBe("2026-10-01");
    expect(result.tariff.sources.map((s) => s.reference)).toContain("S.R.O. 279(I)/2026");
    expect(result.adjustmentSources.map((s) => s.reference)).toEqual(["S.R.O. 1499(I)/2026", "S.R.O. 1501(I)/2026"]);
    expect(result.assumptions.join(" ")).toMatch(/units billed in July 2026/);
    expect(result.exclusions.join(" ")).toMatch(/General Sales Tax/);
  });

  // Regression: LESCO's own S.R.O. 46(I)/2026 (and K-Electric's S.R.O. 1643) were listed for every provider.
  it("lists a provider's own notification for that provider only", async () => {
    const own: Record<string, string> = {
      lesco: "S.R.O. 46(I)/2026",
      hazeco: "S.R.O. 43(I)/2026",
      ke: "S.R.O. 1643(I)/2026",
    };
    for (const providerId of PROVIDER_IDS) {
      const refs = (await success({ providerId })).tariff.sources.map((s) => s.reference);
      expect(refs).toContain("S.R.O. 279(I)/2026");
      for (const [owner, reference] of Object.entries(own)) {
        expect(refs.includes(reference)).toBe(owner === providerId);
      }
    }
  });

  it("effective cost per unit = total / units, rounded to the paisa", async () => {
    const result = await success({ unitsConsumed: 300 });
    expect(result.effectiveCostPerUnit).toBe(35.95); // 10785.82 / 300 = 35.9527
  });

  it("total equals the sum of its lines", async () => {
    const result = await success({ unitsConsumed: 777, sanctionedLoadKw: 3.33, billingMonth: "2026-09" });
    const sum = result.breakdown.lines.reduce((s, l) => s + Math.round(l.amount * 100), 0) / 100;
    expect(result.total).toBe(sum);
  });
});

describe("provider coverage", () => {
  it("every provider, HAZECO included, has a verified tariff", () => {
    expect([...UNIFORM_TARIFF_PROVIDERS].sort()).toEqual([...PROVIDER_IDS].sort());
  });

  eachValue(UNIFORM_TARIFF_PROVIDERS)("%s calculates from the verified uniform tariff", async (providerId) => {
    const result = await success({ providerId, unitsConsumed: 300 });
    expect(result.total).toBe(10785.82);
    expect(result.tariff.providerId).toBe(providerId);
  });
});
