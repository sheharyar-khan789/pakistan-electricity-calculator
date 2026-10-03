import "./support/dom";
import { afterEach, describe, it } from "node:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import SourcesPage from "@/app/sources/page";
import { getProviderFaq } from "@/data/provider-faq";
import { coveredProviders, getSourceUsage } from "@/lib/tariffs/overview";
import { expect } from "./support/expect";

afterEach(() => cleanup());

const usageOf = (reference: string) => getSourceUsage().find((u) => u.document.reference === reference);

describe("source attribution", () => {
  it("S.R.O. 43(I)/2026 applies to HAZECO only", () => {
    const u = usageOf("S.R.O. 43(I)/2026");
    expect(u?.providers).toEqual(["hazeco"]);
    expect(u?.document.effectiveFrom).toBe("2026-01-01");
    expect(u?.document.url).toMatch(/^https:\/\/nepra\.org\.pk\/.*S\.R\.O\.%2043/);
  });

  it("provider notifications are not attributed to other providers", () => {
    expect(usageOf("S.R.O. 46(I)/2026")?.providers).toEqual(["lesco"]);
    expect(usageOf("S.R.O. 1643(I)/2026")?.providers).toEqual(["ke"]);
  });

  it("quoting definition wording does not widen a notification's applicability", () => {
    const u = usageOf("S.R.O. 46(I)/2026");
    expect(u?.uses).toContain("eligibility");
    expect(u?.providers).toEqual(["lesco"]);
  });

  it("the shared tariff notification applies to every covered provider", () => {
    expect(usageOf("S.R.O. 279(I)/2026")?.providers).toEqual(coveredProviders());
  });

  it("adjustment decisions record their bill months", () => {
    expect(usageOf("S.R.O. 1501(I)/2026")?.billingMonths).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(usageOf("S.R.O. 1501(I)/2026")?.uses).toEqual(["qta"]);
  });

  it("each ex-WAPDA company has exactly its own notification", () => {
    for (const n of [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]) {
      expect(usageOf(`S.R.O. ${n}(I)/2026`)?.providers).toHaveLength(1);
    }
    expect(usageOf("S.R.O. 52(I)/2026")?.providers).toEqual(["ke"]);
  });

  it("the HAZECO FAQ names its own notification", () => {
    const answer = getProviderFaq("hazeco", "2026-10")[0].answer;
    expect(answer).toMatch(/HAZECO’s own schedule of tariffs, notified in S\.R\.O\. 43\(I\)\/2026/);
    expect(getProviderFaq("iesco", "2026-10")[0].answer).toMatch(/IESCO’s own schedule of tariffs, notified in S\.R\.O\. 45\(I\)\/2026/);
    expect(/own schedule/.test(getProviderFaq("ke", "2026-10")[0].answer)).toBe(false);
  });
});

describe("/sources page", () => {
  it("shows S.R.O. 43(I)/2026 with its authority, dates and HAZECO applicability", () => {
    render(<SourcesPage />);
    const item = document.getElementById("source-sro-43-2026")!;
    expect(item).toBeTruthy();
    const scoped = within(item);
    expect(scoped.getByText("S.R.O. 43(I)/2026").textContent).toBeTruthy();
    expect(scoped.getByText(/Ministry of Energy \(Power Division\)/).textContent).toBeTruthy();
    expect(scoped.getByText("1 January 2026").textContent).toBeTruthy();
    expect(scoped.getByTestId("applies-to").textContent).toBe("HAZECO");
    const link = scoped.getByRole("link", { name: /Hazara Electric Supply Company/ });
    expect(link.getAttribute("href")).toMatch(/S\.R\.O\.%2043/);
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("lists the shared notification against all supported providers", () => {
    render(<SourcesPage />);
    const item = document.getElementById("source-sro-279-2026")!;
    expect(within(item).getByTestId("applies-to").textContent).toBe(`All ${coveredProviders().length} supported providers`);
    expect(screen.getAllByTestId("applies-to").length).toBe(getSourceUsage().length);
  });
});
