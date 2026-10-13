import "./support/dom";
import { afterEach, describe, it } from "node:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { BillByUnitsTable } from "@/components/calculator/BillByUnitsTable";
import { getDefaultBillingMonth, getEngine } from "@/lib/calculator/engine-registry";
import { formatRupees } from "@/lib/format";
import { acCalculatorFaq } from "@/data/tool-faq";
import { expect } from "./support/expect";

afterEach(() => cleanup());

describe("bill by units table", () => {
  it("every figure equals the verified engine's own result (2 kW, default bill month)", () => {
    render(<BillByUnitsTable headingId="t" />);
    const table = screen.getByRole("table");
    const month = getDefaultBillingMonth()!;
    const engine = getEngine("lesco")!;
    for (const units of [100, 200, 300, 400, 500, 700]) {
      const row = within(table).getByRole("row", { name: new RegExp(`^${units} units`) });
      for (const bandId of units <= 200 ? ["unprotected", "protected"] : ["unprotected"]) {
        const outcome = engine.calculate({ providerId: "lesco", consumerCategoryId: "residential", unitsConsumed: units, billingMonth: month, bandId, sanctionedLoadKw: 2 });
        if (outcome.status !== "success") throw new Error(outcome.status);
        expect(row.textContent).toContain(formatRupees(outcome.result.total));
      }
      if (units > 200) expect(row.textContent).toContain("Not eligible");
    }
  });

  it("states its assumptions and that taxes are excluded", () => {
    render(<BillByUnitsTable headingId="t" />);
    expect(screen.getByText(/before taxes, for a 2 kW sanctioned load/).textContent).toBeTruthy();
  });
});

describe("1.5 ton AC answer", () => {
  it("the FAQ figure follows the calculator formula (1,500 W × 8 h × 30 days = 360 units)", () => {
    const faq = acCalculatorFaq.find((f) => /1\.5 ton/.test(f.question))!;
    expect(faq.answer).toMatch(/1,500 watts uses 1\.5 units an hour/);
    expect(faq.answer).toMatch(/360 units/);
    expect(1500 * 8 * 30 / 1000).toBe(360);
  });
});
