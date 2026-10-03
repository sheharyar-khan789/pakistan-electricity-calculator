import "./support/dom";
import { afterEach, beforeEach, describe, it } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BillChecker } from "@/components/bill-check/BillChecker";
import { ElectricityCalculator } from "@/components/calculator/ElectricityCalculator";
import { AcCalculator } from "@/components/tools/AcCalculator";
import { ApplianceCalculator } from "@/components/tools/ApplianceCalculator";
import { TouCalculator } from "@/components/tools/TouCalculator";
import { UnitCalculator } from "@/components/tools/UnitCalculator";
import { setAnalyticsSink, type AnalyticsEvent } from "@/lib/analytics";
import { expect } from "./support/expect";

/**
 * Runs real flows through every interactive tool and checks every analytics
 * payload: only whitelisted keys, only short identifier-like string values,
 * and none of the numbers the user typed.
 */
const ALLOWED_KEYS = new Set(["name", "providerId", "categoryId", "identifierType", "reason", "context", "tool", "from", "outcome", "guide", "action"]);
const typed = ["08111311234567", "0400012345678", "10250", "10560", "1800", "200", "800", "300", "39538", "10786"];

let events: AnalyticsEvent[] = [];
beforeEach(() => {
  events = [];
  setAnalyticsSink((e) => events.push(e));
  Object.defineProperty(globalThis.navigator, "clipboard", { value: { writeText: async () => {} }, configurable: true });
});
afterEach(() => {
  cleanup();
  setAnalyticsSink(null);
});

const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

function assertClean() {
  expect(events.length).toBeGreaterThan(0);
  for (const event of events) {
    for (const [key, value] of Object.entries(event)) {
      expect(ALLOWED_KEYS.has(key)).toBe(true);
      expect(typeof value).toBe("string");
      expect(/\d{3,}/.test(String(value))).toBe(false);
      for (const t of typed) expect(String(value).includes(t)).toBe(false);
    }
  }
}

describe("analytics never receives identifiers, amounts or inputs", () => {
  it("bill checker (PITC reference number and K-Electric account number)", async () => {
    render(<BillChecker initialProviderId="lesco" />);
    fireEvent.change(screen.getByLabelText("Reference Number", { selector: "input:not([type=radio])" }), {
      target: { value: "08111311234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check Bill" }));
    fireEvent.click(screen.getByRole("link", { name: /Open official LESCO bill page/ }));
    cleanup();
    render(<BillChecker initialProviderId="ke" />);
    fireEvent.change(screen.getByLabelText("Account Number", { selector: "input:not([type=radio])" }), {
      target: { value: "0400012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check Bill" }));
    await waitFor(() => expect(events.some((e) => e.name === "bill_check_redirected")).toBe(true));
    assertClean();
  });

  it("bill calculator", async () => {
    render(<ElectricityCalculator layout="stacked" defaultBillingMonth="2026-10" />);
    type("Electricity provider", "lesco");
    type("Sanctioned load", "2");
    type("Units (kWh) for the billing month", "300");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Bill" }));
    await screen.findByText("Rs. 10,786", {}, { timeout: 5000 });
    assertClean();
  });

  it("TOU, unit, appliance and AC calculators", () => {
    render(<TouCalculator providerIds={["lesco"]} billingMonths={[{ value: "2026-10", label: "October 2026" }]} defaultBillingMonth="2026-10" />);
    type("Electricity provider", "lesco");
    type("Peak units", "200");
    type("Off-peak units", "800");
    type("Sanctioned load", "6");
    fireEvent.click(screen.getByRole("button", { name: "Calculate TOU Bill" }));
    cleanup();
    render(<UnitCalculator />);
    type("Previous reading", "10250");
    type("Current reading", "10560");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Units" }));
    cleanup();
    render(<ApplianceCalculator rateOptions={null} />);
    type("Power", "1800");
    type("Hours per day", "8");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Usage" }));
    cleanup();
    render(<AcCalculator rateOptions={null} />);
    type("Rated input power", "1800");
    type("Hours per day", "8");
    fireEvent.click(screen.getByRole("button", { name: "Calculate AC Cost" }));
    expect(events.filter((e) => e.name === "calculator_completed")).toHaveLength(4);
    assertClean();
  });
});
