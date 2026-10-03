import { describe, it } from "node:test";
import { each, expect } from "./support/expect";
import { addMonths, formatBillingMonth, pickDefaultBillingMonth } from "@/lib/calculator/billing-month";
import { kwTimesRate, scaledToPaisa, toScaled, unitsTimesRate } from "@/lib/calculator/money";
import { computeSlabCharges, findSlabIndex } from "@/lib/calculator/slabs";
import type { Slab } from "@/lib/tariffs/types";

describe("money", () => {
  it("multiplies without floating-point drift", () => {
    // 0.1 + 0.2 style errors must not appear: 3 × 1.1 = 3.3 exactly.
    expect(scaledToPaisa(unitsTimesRate(3, 1.1))).toBe(330);
    expect(scaledToPaisa(unitsTimesRate(101, 28.91))).toBe(291991);
  });

  it("rounds half away from zero, once, at the paisa", () => {
    expect(scaledToPaisa(toScaled(308.715))).toBe(30872);
    expect(scaledToPaisa(toScaled(308.7149))).toBe(30871);
    expect(scaledToPaisa(toScaled(-0.005))).toBe(-1);
    expect(scaledToPaisa(toScaled(-0.0049))).toBe(0);
  });

  it("handles fractional kW exactly", () => {
    expect(scaledToPaisa(kwTimesRate(2.75, 350))).toBe(96250);
    expect(scaledToPaisa(kwTimesRate(0.01, 675))).toBe(675);
  });
});

describe("slab engine", () => {
  const slabs: Slab[] = [
    { fromUnits: 0, toUnits: 100, ratePerUnit: 1 },
    { fromUnits: 101, toUnits: 200, ratePerUnit: 2 },
    { fromUnits: 201, toUnits: null, ratePerUnit: 3 },
  ];

  each([
    [0, 0], [1, 0], [100, 0], [101, 1], [200, 1], [201, 2], [99_999, 2],
  ])("%i units → slab %i", (units, index) => {
    expect(findSlabIndex(units, slabs)).toBe(index);
  });

  it("single-slab pricing charges everything at one rate", () => {
    const charges = computeSlabCharges(150, slabs, "single-slab");
    expect(charges).toHaveLength(1);
    expect(charges[0].unitsCharged).toBe(150);
  });

  it("previous-slab benefit uses exactly one previous slab", () => {
    const charges = computeSlabCharges(250, slabs, "one-previous-slab-benefit");
    expect(charges.map((c) => [c.slab.ratePerUnit, c.unitsCharged])).toEqual([
      [2, 200],
      [3, 50],
    ]);
  });

  it("refuses units outside the table instead of producing a number", () => {
    const capped: Slab[] = [{ fromUnits: 0, toUnits: 100, ratePerUnit: 1 }];
    expect(() => computeSlabCharges(101, capped, "single-slab")).toThrow(RangeError);
    expect(() => computeSlabCharges(-1, slabs, "single-slab")).toThrow(RangeError);
    expect(() => computeSlabCharges(1.5, slabs, "single-slab")).toThrow(RangeError);
  });
});

describe("bill months", () => {
  it("adds and subtracts across years", () => {
    expect(addMonths("2026-01", -2)).toBe("2025-11");
    expect(addMonths("2026-11", 2)).toBe("2027-01");
  });

  it("formats for display", () => {
    expect(formatBillingMonth("2026-10")).toBe("October 2026");
  });

  it("preselects the latest supported month not after today", () => {
    const months = ["2026-08", "2026-09", "2026-10", "2026-11"];
    expect(pickDefaultBillingMonth(months, "2026-10")).toBe("2026-10");
    expect(pickDefaultBillingMonth(months, "2027-03")).toBe("2026-11");
    expect(pickDefaultBillingMonth(months, "2026-01")).toBe("2026-08");
    expect(pickDefaultBillingMonth([], "2026-10")).toBeNull();
  });
});
