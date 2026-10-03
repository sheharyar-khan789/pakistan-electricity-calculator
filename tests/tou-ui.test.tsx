import "./support/dom";
import { afterEach, describe, it } from "node:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { TouCalculator } from "@/components/tools/TouCalculator";
import { setAnalyticsSink, type AnalyticsEvent } from "@/lib/analytics";
import { expect } from "./support/expect";

afterEach(() => {
  cleanup();
  setAnalyticsSink(null);
});

const months = [
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "October 2026" },
];
const setup = () => render(<TouCalculator providerIds={["lesco", "hazeco"]} billingMonths={months} defaultBillingMonth="2026-10" />);
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Calculate TOU Bill" }));

describe("TOU calculator form", () => {
  it("validates and focuses the first invalid field", () => {
    setup();
    submit();
    expect(screen.getByText("Select your electricity provider.").textContent).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Electricity provider"));
  });

  it("rejects a load below 5 kW with a pointer to the slab calculator", () => {
    setup();
    type("Electricity provider", "lesco");
    type("Peak units", "100");
    type("Off-peak units", "300");
    type("Sanctioned load", "3");
    submit();
    expect(screen.getByText(/apply to a sanctioned load of 5 kW or more/).textContent).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Sanctioned load"));
  });

  it("calculates a HAZECO residential estimate with a not-yet-notified FCA, sending no figures", () => {
    const events: AnalyticsEvent[] = [];
    setAnalyticsSink((e) => events.push(e));
    setup();
    type("Electricity provider", "hazeco");
    type("Peak units", "200");
    type("Off-peak units", "800");
    type("Sanctioned load", "6");
    submit();
    const result = screen.getByRole("region", { name: "Your time-of-use estimate" });
    expect(within(result).getByText("Rs. 39,538").textContent).toBe("Rs. 39,538");
    expect(within(result).getByText(/not yet notified/).textContent).toBeTruthy();
    expect(within(result).getByText(/S\.R\.O\. 43\(I\)\/2026/).textContent).toBeTruthy();
    expect(events).toEqual([
      { name: "calculator_started", tool: "tou-calculator" },
      { name: "calculator_completed", tool: "tou-calculator", outcome: "success" },
    ]);
  });

  it("commercial with MDI", () => {
    setup();
    type("Electricity provider", "lesco");
    fireEvent.click(screen.getByLabelText(/Commercial/));
    type("Bill month", "2026-09");
    type("Peak units", "300");
    type("Off-peak units", "1200");
    type("Sanctioned load", "10");
    type(/Maximum demand/, "4");
    submit();
    // 13,146 + 42,180 + 4 kW × 1,250 + 3,087.15 + 779.10 = 64,192.25
    expect(screen.getByText("Rs. 64,192").textContent).toBe("Rs. 64,192");
  });
});
