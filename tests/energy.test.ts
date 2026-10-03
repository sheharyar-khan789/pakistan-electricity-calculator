import { describe, it } from "node:test";
import { each, expect } from "./support/expect";
import {
  DAYS_IN_PROJECTED_MONTH,
  acEnergy,
  applianceEnergy,
  energyCost,
  totalApplianceEnergy,
  unitsFromReadings,
} from "@/lib/energy/calculate";
import { RULES, parseNumber, roundTo } from "@/lib/energy/parse";
import { formatEstimatedCost, formatKwh } from "@/lib/energy/format";
import { getRateOptions } from "@/lib/energy/tariff-rates";
import {
  CURRENT_BELOW_PREVIOUS,
  validateAcForm,
  validateApplianceRow,
  validateRate,
  validateReadingsForm,
  type AcFormValues,
} from "@/lib/energy/validate";

const close = (actual: number, expected: number) => expect(roundTo(actual, 9)).toBe(expected);

describe("appliance energy", () => {
  it("100 W for 1 hour is 0.1 kWh", () => {
    const e = applianceEnergy({ watts: 100, quantity: 1, hoursPerDay: 1, daysPerMonth: 1 });
    close(e.dailyKwh, 0.1);
    close(e.monthlyKwh, 0.1);
  });

  it("100 W for 24 hours is 2.4 kWh a day and 72 kWh over 30 days", () => {
    const e = applianceEnergy({ watts: 100, quantity: 1, hoursPerDay: 24, daysPerMonth: 30 });
    close(e.dailyKwh, 2.4);
    close(e.monthlyKwh, 72);
  });

  it("multiplies by quantity", () => {
    const e = applianceEnergy({ watts: 75, quantity: 3, hoursPerDay: 10, daysPerMonth: 30 });
    close(e.dailyKwh, 2.25);
    close(e.monthlyKwh, 67.5);
  });

  it("keeps fractional wattage", () => {
    const e = applianceEnergy({ watts: 8.5, quantity: 4, hoursPerDay: 6, daysPerMonth: 30 });
    close(e.dailyKwh, 0.204);
    close(e.monthlyKwh, 6.12);
  });

  each<[number, number]>([
    [28, 33.6],
    [30, 36],
    [31, 37.2],
  ])("different days per month: %s days", (days, monthly) => {
    const e = applianceEnergy({ watts: 1200, quantity: 1, hoursPerDay: 1, daysPerMonth: days });
    close(e.monthlyKwh, monthly);
  });

  it("0 hours gives 0 kWh", () => {
    expect(applianceEnergy({ watts: 500, quantity: 2, hoursPerDay: 0, daysPerMonth: 30 }).monthlyKwh).toBe(0);
  });

  it("sums multiple appliances, each with its own days", () => {
    const total = totalApplianceEnergy([
      { watts: 100, quantity: 1, hoursPerDay: 24, daysPerMonth: 30 }, // 72
      { watts: 75, quantity: 3, hoursPerDay: 10, daysPerMonth: 30 }, // 67.5
      { watts: 1000, quantity: 1, hoursPerDay: 0.5, daysPerMonth: 8 }, // 4
    ]);
    expect(total.items).toHaveLength(3);
    close(total.dailyKwh, 2.4 + 2.25 + 0.5);
    close(total.monthlyKwh, 143.5);
  });

  it("an empty list totals zero", () => {
    expect(totalApplianceEnergy([]).monthlyKwh).toBe(0);
  });

  it("cost is kWh × rate", () => {
    close(energyCost(67.5, 40), 2700);
    close(energyCost(0.1, 45.25), 4.525);
  });
});

describe("AC energy", () => {
  it("1,800 W for 8 hours over 30 days at 100% is 432 kWh", () => {
    const e = acEnergy({ watts: 1800, quantity: 1, hoursPerDay: 8, daysPerMonth: 30, runningSharePercent: 100 });
    close(e.dailyKwh, 14.4);
    close(e.monthlyKwh, 432);
  });

  it("scales with time at rated power and quantity", () => {
    const e = acEnergy({ watts: 1500, quantity: 2, hoursPerDay: 10, daysPerMonth: 30, runningSharePercent: 60 });
    close(e.dailyKwh, 18);
    close(e.monthlyKwh, 540);
  });
});

describe("units from meter readings", () => {
  it("subtracts readings and projects a month", () => {
    const r = unitsFromReadings({ previousReading: 10250, currentReading: 10560, billingDays: 31 });
    expect(r).toEqual({ ok: true, units: 310, averagePerDay: 10, projectedMonthlyUnits: 10 * DAYS_IN_PROJECTED_MONTH });
  });

  it("works without days", () => {
    expect(unitsFromReadings({ previousReading: 5, currentReading: 5, billingDays: null })).toEqual({
      ok: true,
      units: 0,
      averagePerDay: null,
      projectedMonthlyUnits: null,
    });
  });

  it("avoids floating-point noise with decimal readings", () => {
    const r = unitsFromReadings({ previousReading: 1200.2, currentReading: 1234.6, billingDays: null });
    expect(r.ok && r.units).toBe(34.4);
  });

  it("rejects a current reading below the previous one", () => {
    expect(unitsFromReadings({ previousReading: 200, currentReading: 100, billingDays: 30 })).toEqual({
      ok: false,
      reason: "current-below-previous",
    });
  });
});

describe("number parsing", () => {
  each<[string, string]>([
    ["", "Enter power."],
    ["   ", "Enter power."],
    ["0", "Power must be greater than 0 watts and no more than 100,000 watts."],
    ["-5", "Power cannot be negative."],
    ["abc", "Power must be a number, for example 12 or 12.5."],
    ["12abc", "Power must be a number, for example 12 or 12.5."],
    ["1e3", "Power must be a number, for example 12 or 12.5."],
    ["Infinity", "Power must be a number, for example 12 or 12.5."],
    ["100001", "Power must be greater than 0 watts and no more than 100,000 watts."],
    ["9".repeat(400), "Power must be greater than 0 watts and no more than 100,000 watts."],
  ])("watts %j → %s", (raw, message) => {
    expect(parseNumber(raw, RULES.watts)).toEqual({ ok: false, message });
  });

  each<[string, number]>([
    ["100", 100],
    ["8.5", 8.5],
    [".5", 0.5],
    ["1,500", 1500],
    [" 60 ", 60],
  ])("watts %j → %s", (raw, value) => {
    expect(parseNumber(raw, RULES.watts)).toEqual({ ok: true, value });
  });

  it("uses the required messages for hours and days", () => {
    expect(parseNumber("25", RULES.hoursPerDay)).toEqual({ ok: false, message: "Hours per day must be between 0 and 24." });
    expect(parseNumber("0", RULES.hoursPerDay)).toEqual({ ok: true, value: 0 });
    expect(parseNumber("24", RULES.hoursPerDay)).toEqual({ ok: true, value: 24 });
    expect(parseNumber("0", RULES.daysPerMonth)).toEqual({ ok: false, message: "Days per month must be between 1 and 31." });
    expect(parseNumber("32", RULES.daysPerMonth)).toEqual({ ok: false, message: "Days per month must be between 1 and 31." });
    expect(parseNumber("30.5", RULES.daysPerMonth)).toEqual({ ok: false, message: "Days per month must be a whole number." });
    expect(parseNumber("1.5", RULES.quantity)).toEqual({ ok: false, message: "Quantity must be a whole number." });
  });
});

describe("form validation", () => {
  it("appliance row: collects every field error", () => {
    const r = validateApplianceRow({ watts: "", quantity: "0", hoursPerDay: "30", daysPerMonth: "-1" });
    expect(r).toEqual({
      ok: false,
      errors: {
        watts: "Enter power.",
        quantity: "Quantity must be a whole number from 1 to 100.",
        hoursPerDay: "Hours per day must be between 0 and 24.",
        daysPerMonth: "Days per month cannot be negative.",
      },
    });
  });

  it("appliance row: returns typed input", () => {
    expect(validateApplianceRow({ watts: "60", quantity: "2", hoursPerDay: "5.5", daysPerMonth: "30" })).toEqual({
      ok: true,
      input: { watts: 60, quantity: 2, hoursPerDay: 5.5, daysPerMonth: 30 },
    });
  });

  it("rate is optional but must be valid when given", () => {
    expect(validateRate("")).toEqual({ ok: true, value: null });
    expect(validateRate("45.5")).toEqual({ ok: true, value: 45.5 });
    expect(validateRate("0")).toEqual({
      ok: false,
      message: "Rate per unit must be greater than Rs. 0 and no more than Rs. 1,000.",
    });
  });

  it("readings: current below previous is an error on the current reading", () => {
    expect(validateReadingsForm({ previousReading: "500", currentReading: "400", billingDays: "" })).toEqual({
      ok: false,
      errors: { currentReading: CURRENT_BELOW_PREVIOUS },
    });
  });

  it("readings: days are optional and must be whole", () => {
    expect(validateReadingsForm({ previousReading: "1", currentReading: "2", billingDays: "" })).toEqual({
      ok: true,
      input: { previousReading: 1, currentReading: 2, billingDays: null },
    });
    const r = validateReadingsForm({ previousReading: "1", currentReading: "2", billingDays: "0" });
    expect(r.ok).toBe(false);
  });

  const ac = (o: Partial<AcFormValues> = {}): AcFormValues => ({
    power: "1.5",
    powerUnit: "kW",
    quantity: "1",
    hoursPerDay: "8",
    daysPerMonth: "30",
    runningShare: "100",
    ...o,
  });

  it("AC: converts kW to watts", () => {
    const r = validateAcForm(ac());
    expect(r.ok && r.input.watts).toBe(1500);
  });

  it("AC: validates power against the selected unit", () => {
    expect(validateAcForm(ac({ power: "150" }))).toEqual({
      ok: false,
      errors: { power: "Power must be greater than 0 kW and no more than 100 kW." },
    });
    const r = validateAcForm(ac({ power: "150", powerUnit: "W" }));
    expect(r.ok && r.input.watts).toBe(150);
  });

  it("AC: time at rated power must be above 0 and at most 100", () => {
    const message = "Time at rated power must be greater than 0% and no more than 100%.";
    expect(validateAcForm(ac({ runningShare: "0" }))).toEqual({ ok: false, errors: { runningShare: message } });
    expect(validateAcForm(ac({ runningShare: "101" }))).toEqual({ ok: false, errors: { runningShare: message } });
  });
});

describe("display rounding", () => {
  it("shrinks precision as numbers grow", () => {
    expect(formatKwh(0)).toBe("0 kWh");
    expect(formatKwh(0.104)).toBe("0.1 kWh");
    expect(formatKwh(2.256)).toBe("2.26 kWh");
    expect(formatKwh(67.54)).toBe("67.5 kWh");
    expect(formatKwh(1234.6)).toBe("1,235 kWh");
  });

  it("rounds costs to the rupee, keeping paisa for small amounts", () => {
    expect(formatEstimatedCost(2700.4)).toBe("Rs. 2,700");
    expect(formatEstimatedCost(4.525)).toBe("Rs. 4.53");
  });
});

describe("official rate options", () => {
  const options = getRateOptions();

  it("come from verified data with source references", () => {
    expect(options).toBeTruthy();
    expect(options!.references).toContain("S.R.O. 279(I)/2026");
    expect(options!.options.length).toBeGreaterThan(5);
  });

  it("name every adjustment as either included or not yet notified, never both", () => {
    for (const kind of ["FCA", "QTA"]) {
      const included = options!.adjustmentsText.includes(`(${kind})`);
      const pending = (options!.pendingText ?? "").includes(`(${kind})`);
      expect(included !== pending).toBe(true);
    }
  });

  it("add the bill month's FCA and QTA, never to lifeline", () => {
    for (const o of options!.options) {
      expect(o.ratePerUnit).toBe(roundTo(o.baseRate + o.adjustmentsPerUnit, 2));
      if (o.id.startsWith("lifeline")) expect(o.adjustmentsPerUnit).toBe(0);
    }
  });
});
