import "./support/dom";
import { afterEach, describe, it } from "node:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ElectricityCalculator } from "@/components/calculator/ElectricityCalculator";
import { expect } from "./support/expect";

afterEach(() => cleanup());

function setup(props: Parameters<typeof ElectricityCalculator>[0] = {}) {
  render(<ElectricityCalculator layout="stacked" defaultBillingMonth="2026-10" {...props} />);
  return {
    provider: () => screen.getByLabelText("Electricity provider"),
    category: () => screen.getByLabelText("Consumer type"),
    load: () => screen.getByLabelText("Sanctioned load"),
    units: () => screen.getByLabelText("Units (kWh) for the billing month"),
    month: () => screen.getByLabelText("Bill month"),
    submit: () => fireEvent.click(screen.getByRole("button", { name: "Calculate Bill" })),
    result: () => screen.getByRole("region", { name: "Your estimate" }),
  };
}

describe("calculator interaction", () => {
  it("shows the empty state before calculating", () => {
    const ui = setup();
    expect(within(ui.result()).getByText("Estimated electricity bill").textContent).toBe("Estimated electricity bill");
  });

  it("validates an empty submit and focuses the first error", () => {
    const ui = setup();
    fireEvent.change(ui.load(), { target: { value: "" } });
    ui.submit();
    expect(screen.getByText("Select your electricity provider.").textContent).toBeTruthy();
    expect(document.activeElement).toBe(ui.provider());
    expect(ui.provider().getAttribute("aria-invalid")).toBe("true");
  });

  it("calculates a real LESCO estimate end to end", async () => {
    const ui = setup();
    fireEvent.change(ui.provider(), { target: { value: "lesco" } });
    fireEvent.change(ui.load(), { target: { value: "2" } });
    fireEvent.change(ui.units(), { target: { value: "300" } });
    ui.submit();
    // 300 × 33.10 + 2 kW × 350 + 300 × 0.5194 = 10,785.82 → displayed to the rupee.
    const total = await screen.findByText("Rs. 10,786", {}, { timeout: 5000 });
    expect(total.textContent).toBe("Rs. 10,786");
    expect(within(ui.result()).getByText(/Estimated bill before taxes/).textContent).toBeTruthy();
    expect(within(ui.result()).getByText(/not notified the fuel charges adjustment for August 2026/).textContent).toBeTruthy();
  });

  it("uses the bill month to pick adjustments", async () => {
    const ui = setup({ initialProviderId: "ke" });
    fireEvent.change(ui.month(), { target: { value: "2026-09" } });
    fireEvent.change(ui.load(), { target: { value: "2" } });
    fireEvent.change(ui.units(), { target: { value: "100" } });
    ui.submit();
    // 2,244 + 550 + FCA 205.81 + QTA 51.94 = 3,051.75
    expect((await screen.findByText("Rs. 3,052", {}, { timeout: 5000 })).textContent).toBe("Rs. 3,052");
  });

  it("protected status above 200 units shows an error instead of a figure", async () => {
    const ui = setup({ initialProviderId: "iesco" });
    fireEvent.click(screen.getByLabelText(/^Protected/));
    fireEvent.change(ui.load(), { target: { value: "2" } });
    fireEvent.change(ui.units(), { target: { value: "250" } });
    ui.submit();
    expect((await screen.findByText(/only apply up to 200 units/, {}, { timeout: 5000 })).textContent).toBeTruthy();
    expect(screen.queryByText(/Estimated bill before taxes/)).toBe(null);
  });

  it("explains unsupported categories without numbers", async () => {
    const ui = setup({ initialProviderId: "mepco" });
    fireEvent.change(ui.category(), { target: { value: "industrial" } });
    expect(screen.getByText(/Industrial estimates are not available yet/).textContent).toBeTruthy();
    fireEvent.change(ui.units(), { target: { value: "500" } });
    ui.submit();
    expect((await screen.findByText("Estimate not available yet", {}, { timeout: 5000 })).textContent).toBeTruthy();
  });

  it("meter readings produce units and an estimate", async () => {
    const ui = setup({ initialProviderId: "fesco" });
    fireEvent.click(screen.getByLabelText("Use meter readings"));
    fireEvent.change(ui.load(), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Previous reading"), { target: { value: "10450" } });
    fireEvent.change(screen.getByLabelText("Current reading"), { target: { value: "10550" } });
    ui.submit();
    // 100 units: 2,244 + 550 + 51.94 = 2,845.94
    expect((await screen.findByText("Rs. 2,846", {}, { timeout: 5000 })).textContent).toBe("Rs. 2,846");
  });

  it("5 kW load is reported as not supported", async () => {
    const ui = setup({ initialProviderId: "gepco" });
    fireEvent.change(ui.load(), { target: { value: "5" } });
    fireEvent.change(ui.units(), { target: { value: "300" } });
    ui.submit();
    expect((await screen.findByText(/time-of-use tariffs/, {}, { timeout: 5000 })).textContent).toBeTruthy();
  });
});
