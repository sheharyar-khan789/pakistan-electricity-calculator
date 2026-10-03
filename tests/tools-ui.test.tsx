import "./support/dom";
import { afterEach, describe, it } from "node:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { UnitCalculator } from "@/components/tools/UnitCalculator";
import { ApplianceCalculator } from "@/components/tools/ApplianceCalculator";
import { AcCalculator } from "@/components/tools/AcCalculator";
import { getRateOptions } from "@/lib/energy/tariff-rates";
import { setAnalyticsSink, type AnalyticsEvent } from "@/lib/analytics";
import { expect } from "./support/expect";

afterEach(() => {
  cleanup();
  setAnalyticsSink(null);
});

const type = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("unit calculator", () => {
  it("validates and focuses the first invalid field", () => {
    render(<UnitCalculator />);
    fireEvent.click(screen.getByRole("button", { name: "Calculate Units" }));
    expect(screen.getByText("Enter previous reading.").textContent).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Previous reading"));
    expect(screen.getByLabelText("Previous reading").getAttribute("aria-invalid")).toBe("true");
  });

  it("calculates units, daily average and a monthly estimate", () => {
    render(<UnitCalculator />);
    type("Previous reading", "10250");
    type("Current reading", "10560");
    type(/Days between the readings/, "31");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Units" }));
    const result = screen.getByRole("region", { name: "Units used" });
    expect(within(result).getByText("310 units").textContent).toBe("310 units");
    expect(within(result).getByText("10 kWh").textContent).toBe("10 kWh");
    expect(within(result).getByText("300 kWh").textContent).toBe("300 kWh");
  });

  it("explains a current reading below the previous one", () => {
    render(<UnitCalculator />);
    type("Previous reading", "500");
    type("Current reading", "400");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Units" }));
    expect(screen.getByText(/must be the same as or higher than the previous reading/).textContent).toBeTruthy();
  });
});

describe("appliance calculator", () => {
  it("shows units only when no rate is entered", () => {
    render(<ApplianceCalculator rateOptions={null} />);
    type("Power", "100");
    type("Hours per day", "24");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Usage" }));
    const result = screen.getByRole("region", { name: "Appliance usage" });
    expect(within(result).getByText("Estimated units per month").textContent).toBeTruthy();
    expect(within(result).getAllByText("72 kWh").length).toBeGreaterThan(0);
    expect(within(result).getByText("2.4 kWh").textContent).toBe("2.4 kWh");
  });

  it("totals several appliances and estimates cost at the user's rate", () => {
    render(<ApplianceCalculator rateOptions={null} />);
    type("Power", "100");
    type("Hours per day", "24");
    fireEvent.click(screen.getByRole("button", { name: "Add another appliance" }));
    const second = screen.getByRole("group", { name: "Appliance 2" });
    fireEvent.change(within(second).getByLabelText("Power"), { target: { value: "75" } });
    fireEvent.change(within(second).getByLabelText("Quantity"), { target: { value: "3" } });
    fireEvent.change(within(second).getByLabelText("Hours per day"), { target: { value: "10" } });
    type(/Rate per unit/, "40");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Usage" }));
    const result = screen.getByRole("region", { name: "Appliance usage" });
    // (72 + 67.5) kWh × Rs. 40 = Rs. 5,580
    expect(within(result).getByText("Rs. 5,580").textContent).toBe("Rs. 5,580");
    expect(within(result).getByText("Estimated monthly cost").textContent).toBeTruthy();
  });

  it("shows field messages for invalid input", () => {
    render(<ApplianceCalculator rateOptions={null} />);
    type("Power", "-5");
    type("Hours per day", "25");
    type("Days per month", "0");
    fireEvent.click(screen.getByRole("button", { name: "Calculate Usage" }));
    expect(screen.getByText("Power cannot be negative.").textContent).toBeTruthy();
    expect(screen.getByText("Hours per day must be between 0 and 24.").textContent).toBeTruthy();
    expect(screen.getByText("Days per month must be between 1 and 31.").textContent).toBeTruthy();
  });

  it("fills a verified tariff rate only when the user picks one", () => {
    const options = getRateOptions()!;
    render(<ApplianceCalculator rateOptions={options} />);
    const rate = screen.getByLabelText(/^Rate per unit/) as HTMLInputElement;
    expect(rate.value).toBe("");
    const first = options.options[0];
    fireEvent.change(screen.getByLabelText(/Or fill in an official tariff rate/), { target: { value: first.id } });
    expect(rate.value).toBe(first.ratePerUnit.toFixed(2));
  });
});

describe("AC calculator", () => {
  it("calculates units and cost, sending no figures to analytics", () => {
    const events: AnalyticsEvent[] = [];
    setAnalyticsSink((e) => events.push(e));
    render(<AcCalculator rateOptions={null} />);
    type("Rated input power", "1800");
    type("Hours per day", "8");
    type(/Rate per unit/, "40");
    fireEvent.click(screen.getByRole("button", { name: "Calculate AC Cost" }));
    const result = screen.getByRole("region", { name: "AC electricity use" });
    expect(within(result).getByText("Rs. 17,280").textContent).toBe("Rs. 17,280");
    expect(within(result).getByText(/Full-power estimate/).textContent).toBeTruthy();
    expect(events).toEqual([
      { name: "calculator_started", tool: "ac-calculator" },
      { name: "calculator_completed", tool: "ac-calculator", outcome: "success" },
    ]);
  });

  it("switches the power unit to kW", () => {
    render(<AcCalculator rateOptions={null} />);
    fireEvent.click(screen.getByLabelText("Kilowatts (kW)"));
    type("Rated input power", "1.5");
    type("Hours per day", "10");
    fireEvent.click(screen.getByRole("button", { name: "Calculate AC Cost" }));
    const result = screen.getByRole("region", { name: "AC electricity use" });
    expect(within(result).getAllByText("450 kWh").length).toBeGreaterThan(0);
  });
});
