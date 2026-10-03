import "./support/dom";
import { afterEach, beforeEach, describe, it } from "node:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BillChecker } from "@/components/bill-check/BillChecker";
import { setAnalyticsSink, type AnalyticsEvent } from "@/lib/analytics";
import { expect } from "./support/expect";

const REF = "08111311234567"; // shape only — not a real account
let copied: string[] = [];
let events: AnalyticsEvent[] = [];

beforeEach(() => {
  copied = [];
  events = [];
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText: async (t: string) => void copied.push(t) },
    configurable: true,
  });
  setAnalyticsSink((e) => events.push(e));
});
afterEach(() => {
  cleanup();
  setAnalyticsSink(null);
});

const provider = () => screen.getByLabelText("Electricity provider") as HTMLSelectElement;
/** The identifier text box (radio options can share its label). */
const textbox = (label: string) => screen.getByLabelText(label, { selector: "input:not([type=radio])" });
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Check Bill" }));

describe("bill checker interaction", () => {
  it("asks for a provider first and focuses the select", () => {
    render(<BillChecker />);
    submit();
    expect(screen.getByText("Please select your electricity provider.").textContent).toBeTruthy();
    expect(document.activeElement).toBe(provider());
  });

  it("shows only the identifier types the provider supports", () => {
    render(<BillChecker />);
    fireEvent.change(provider(), { target: { value: "iesco" } });
    expect(screen.getByLabelText("Customer ID")).toBeTruthy();
    fireEvent.change(provider(), { target: { value: "ke" } });
    expect(screen.queryByLabelText("Customer ID")).toBe(null);
    expect(screen.getByLabelText("Account Number")).toBeTruthy();
  });

  it("explains a wrong length with an accessible error", () => {
    render(<BillChecker initialProviderId="mepco" />);
    const input = textbox("Reference Number");
    fireEvent.change(input, { target: { value: "12345" } });
    submit();
    expect(screen.getByText(/exactly 14 digits/).textContent).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby") ?? "").toContain("error");
    expect(document.activeElement).toBe(input);
  });

  it("hands off to the official page in a new tab without exposing the number", async () => {
    render(<BillChecker initialProviderId="lesco" lockProvider />);
    fireEvent.change(textbox("Reference Number"), { target: { value: "08 11131 1234567 U" } });
    submit();
    const link = screen.getByRole("link", { name: /Open official LESCO bill page/ }) as HTMLAnchorElement;
    expect(link.href).toBe("https://bill.pitc.com.pk/lescobill");
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
    expect(link.href).not.toContain(REF);
    expect(screen.getByText(/choose “U”/).textContent).toBeTruthy();
    fireEvent.click(link);
    await waitFor(() => expect(copied).toEqual([REF]));
    expect((await screen.findByText(/Number copied/, {}, { timeout: 5000 })).textContent).toBeTruthy();
  });

  it("Customer ID mode uses the provider's own length (LESCO: 11 digits)", () => {
    render(<BillChecker initialProviderId="lesco" />);
    fireEvent.click(screen.getByLabelText("Customer ID"));
    const input = textbox("Customer ID");
    fireEvent.change(input, { target: { value: "1234567890" } });
    submit();
    expect(screen.getByText(/exactly 11 digits/).textContent).toBeTruthy();
  });

  it("K-Electric hand-off mentions the CAPTCHA", () => {
    render(<BillChecker initialProviderId="ke" />);
    fireEvent.change(textbox("Account Number"), { target: { value: "0400012345678" } });
    submit();
    const link = screen.getByRole("link", { name: /Open official K-Electric bill page/ }) as HTMLAnchorElement;
    expect(link.href).toBe("https://ke.com.pk/bills-e-payments/");
    expect(screen.getByText(/CAPTCHA/).textContent).toBeTruthy();
  });

  it("analytics events never contain the identifier", () => {
    render(<BillChecker initialProviderId="iesco" />);
    fireEvent.change(textbox("Reference Number"), { target: { value: REF } });
    submit();
    fireEvent.click(screen.getByRole("link", { name: /Open official IESCO bill page/ }));
    expect(events.map((e) => e.name)).toEqual(["bill_check_started", "bill_check_redirected"]);
    expect(JSON.stringify(events)).not.toContain(REF);
  });
});
