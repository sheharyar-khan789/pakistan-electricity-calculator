import "./support/dom";
import { afterEach, describe, it } from "node:test";
import { cleanup, render, screen } from "@testing-library/react";
import ContactPage from "@/app/contact/page";
import { checkLaunchReadiness, resolveSiteSettings } from "@/config/site";
import { expect } from "./support/expect";

afterEach(() => cleanup());

const prod = {
  NEXT_PUBLIC_SITE_URL: "https://electricity.example",
  NEXT_PUBLIC_ENABLE_INDEXING: "true",
  NEXT_PUBLIC_CONTACT_EMAIL: "hello@electricity.example",
};

describe("contact email setting", () => {
  it("accepts a plain address and trims it", () => {
    expect(resolveSiteSettings({ NEXT_PUBLIC_CONTACT_EMAIL: "  hello@electricity.example " }).contactEmail).toBe(
      "hello@electricity.example",
    );
  });

  it("treats empty as unset", () => {
    expect(resolveSiteSettings({ NEXT_PUBLIC_CONTACT_EMAIL: "   " }).contactEmail).toBeNull();
  });

  for (const bad of ["mailto:hello@electricity.example", "hello", "hello@localhost", "a b@electricity.example", "<x>@y.com"]) {
    it(`rejects ${JSON.stringify(bad)}`, () => {
      expect(() => resolveSiteSettings({ NEXT_PUBLIC_CONTACT_EMAIL: bad })).toThrow();
    });
  }
});

describe("launch readiness", () => {
  it("a complete production configuration has no blockers", () => {
    const r = checkLaunchReadiness(prod);
    expect(r.mode).toBe("production");
    expect(r.blockers).toEqual([]);
    expect(r.warnings).toHaveLength(1); // Search Console tag optional (DNS verification)
  });

  it("lists each missing owner value without inventing one", () => {
    const r = checkLaunchReadiness({});
    expect(r.mode).toBe("pre-launch");
    expect(r.blockers.join("\n")).toMatch(/NEXT_PUBLIC_SITE_URL/);
    expect(r.blockers.join("\n")).toMatch(/NEXT_PUBLIC_ENABLE_INDEXING/);
    expect(r.blockers.join("\n")).toMatch(/NEXT_PUBLIC_CONTACT_EMAIL/);
  });

  it("missing contact email blocks a public launch", () => {
    const r = checkLaunchReadiness({ ...prod, NEXT_PUBLIC_CONTACT_EMAIL: "" });
    expect(r.blockers).toHaveLength(1);
    expect(r.blockers[0]).toMatch(/contact/);
  });

  it("an unsafe indexed URL is reported instead of throwing", () => {
    const r = checkLaunchReadiness({ ...prod, NEXT_PUBLIC_SITE_URL: "https://my-app.vercel.app" });
    expect(r.blockers[0]).toMatch(/public https production origin/);
  });

  it("previews are never production", () => {
    const r = checkLaunchReadiness({ ...prod, VERCEL_ENV: "preview" });
    expect(r.mode).toBe("preview");
    expect(r.blockers).toEqual([]);
  });
});

describe("/contact without an address", () => {
  it("states plainly that no address is published, with no placeholder text", () => {
    render(<ContactPage />);
    expect(screen.getByText(/No contact address has been published/).textContent).toBeTruthy();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});

describe("bill checker is described as a hand-off, never as bill retrieval", () => {
  it("terms state the site does not retrieve, store or pay bills", async () => {
    const { default: TermsPage } = await import("@/app/terms/page");
    render(<TermsPage />);
    expect(screen.getByText(/does not retrieve, display, store or pay bills/).textContent).toBeTruthy();
  });

  it("homepage hero says the format is checked and the provider shows the bill", async () => {
    const { HomeHero } = await import("@/components/home/HomeHero");
    render(<HomeHero />);
    expect(screen.getByText(/We check its format/).textContent).toMatch(/where your bill is shown/);
    expect(screen.queryByText("Official provider bill pages")).toBeNull();
  });
});
