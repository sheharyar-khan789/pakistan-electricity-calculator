import { describe, it } from "node:test";
import { each, expect } from "./support/expect";
import { getCategoryRequirements } from "@/lib/calculator/engine-registry";
import {
  parseSanctionedLoad,
  validateCalculatorForm,
  type CalculatorFieldName,
  type CalculatorFormValues,
} from "@/lib/calculator/validation";

type InvalidCase = [name: string, overrides: Partial<CalculatorFormValues>, field: CalculatorFieldName];

const requirements = getCategoryRequirements("residential", "lesco");

const values = (overrides: Partial<CalculatorFormValues> = {}): CalculatorFormValues => ({
  providerId: "lesco",
  consumerCategoryId: "residential",
  billingMonth: "2026-10",
  bandId: "unprotected",
  sanctionedLoad: "2",
  inputMode: "units",
  units: "250",
  previousReading: "",
  currentReading: "",
  ...overrides,
});

describe("calculator form validation", () => {
  it("accepts a complete form", () => {
    const result = validateCalculatorForm(values(), requirements);
    expect(result).toEqual({
      ok: true,
      input: {
        providerId: "lesco",
        consumerCategoryId: "residential",
        unitsConsumed: 250,
        billingMonth: "2026-10",
        bandId: "unprotected",
        sanctionedLoadKw: 2,
      },
    });
  });

  each<InvalidCase>([
    ["empty units", { units: "" }, "units"],
    ["negative units", { units: "-5" }, "units"],
    ["decimal units", { units: "12.5" }, "units"],
    ["huge units", { units: "9999999" }, "units"],
    ["missing provider", { providerId: "" }, "providerId"],
    ["invalid provider", { providerId: "acme" }, "providerId"],
    ["invalid category", { consumerCategoryId: "space" }, "consumerCategoryId"],
    ["unsupported month", { billingMonth: "2027-01" }, "billingMonth"],
    ["unknown status", { bandId: "vip" }, "bandId"],
    ["missing load", { sanctionedLoad: "" }, "sanctionedLoad"],
    ["zero load", { sanctionedLoad: "0" }, "sanctionedLoad"],
    ["text load", { sanctionedLoad: "two" }, "sanctionedLoad"],
    ["3 dp load", { sanctionedLoad: "2.555" }, "sanctionedLoad"],
  ])("rejects %s", (_name, overrides, field) => {
    const result = validateCalculatorForm(values(overrides), requirements);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[field]).toBeTruthy();
  });

  it("accepts units typed with commas and spaces", () => {
    const result = validateCalculatorForm(values({ units: " 1,250 " }), requirements);
    expect(result.ok && result.input.unitsConsumed).toBe(1250);
  });

  it("derives units from meter readings", () => {
    const result = validateCalculatorForm(
      values({ inputMode: "readings", previousReading: "10450", currentReading: "10700" }),
      requirements,
    );
    expect(result.ok && result.input.unitsConsumed).toBe(250);
  });

  it("rejects a current reading below the previous one", () => {
    const result = validateCalculatorForm(
      values({ inputMode: "readings", previousReading: "10700", currentReading: "10450" }),
      requirements,
    );
    expect(result.ok).toBe(false);
  });

  it("parses sanctioned load formats", () => {
    expect(parseSanctionedLoad("2")).toBe(2);
    expect(parseSanctionedLoad("2.5 kW")).toBe(2.5);
    expect(parseSanctionedLoad("-1")).toBeNull();
    expect(parseSanctionedLoad("1e3")).toBeNull();
  });
});
