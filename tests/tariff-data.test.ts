import { describe, it } from "node:test";
import { expect } from "./support/expect";
import { buildEngines } from "@/lib/calculator/engine-registry";
import {
  adjustmentData,
  loadTariffData,
  sourceDocuments,
  tariffSchedules,
  validateTariffDataset,
  type TariffDataset,
} from "@/lib/tariffs";
import { uniformSchedule2026Feb } from "@/lib/tariffs/data/uniform-2026-02";
import type { TariffSchedule } from "@/lib/tariffs/types";
import { isIsoDate, validateSlabs } from "@/lib/tariffs/validate";

const real: TariffDataset = { schedules: tariffSchedules, adjustments: adjustmentData, sources: sourceDocuments };

/** Deep copy so each test can corrupt its own data. */
function clone(): TariffDataset {
  return structuredClone(real) as TariffDataset;
}

function residential(data: TariffDataset) {
  const schedule = data.schedules[0] as unknown as { categories: { categoryId: string; bands: { id: string; slabs: object[] }[] }[] };
  return schedule.categories.find((c) => c.categoryId === "residential")!;
}

describe("production tariff data", () => {
  it("passes every validation rule", () => {
    expect(validateTariffDataset(real)).toEqual([]);
    expect(loadTariffData().ok).toBe(true);
  });

  it("matches the official S.R.O. 279(I)/2026 GoP applicable figures", () => {
    const res = uniformSchedule2026Feb.categories.find((c) => c.categoryId === "residential")!;
    const band = (id: string) => res.bands.find((b) => b.id === id)!;
    expect(band("unprotected").slabs.map((s) => [s.ratePerUnit, s.fixedChargePerKwPerMonth])).toEqual([
      [22.44, 275], [28.91, 300], [33.1, 350], [36.46, 400],
      [38.95, 500], [40.22, 675], [41.85, 675], [47.2, 675],
    ]);
    expect(band("protected").slabs.map((s) => [s.ratePerUnit, s.fixedChargePerKwPerMonth])).toEqual([
      [10.54, 200], [13.01, 300],
    ]);
    expect(band("lifeline").slabs.map((s) => s.ratePerUnit)).toEqual([3.95, 7.74]);
    const commercial = uniformSchedule2026Feb.categories.find((c) => c.categoryId === "commercial")!;
    expect(commercial.bands[0].slabs[0].ratePerUnit).toBe(37.44);
    expect(commercial.bands[0].fixedCharge).toEqual({ kind: "per-consumer", amountPerMonth: 1000 });
  });

  it("every adjustment cites an official source", () => {
    for (const adj of adjustmentData.adjustments) {
      const doc = sourceDocuments.find((d) => d.id === adj.sourceId);
      expect(doc?.url).toMatch(/^https:\/\/nepra\.org\.pk\//);
    }
  });

  it("keeps adjustments separate from the base tariff", () => {
    const text = JSON.stringify(uniformSchedule2026Feb);
    for (const adj of adjustmentData.adjustments) expect(text).not.toContain(String(adj.ratePerUnit));
  });
});

describe("validation rejects malformed data", () => {
  it("missing source reference", () => {
    const d = clone();
    (d.schedules[0] as unknown as { sourceIds: string[] }).sourceIds = ["does-not-exist"];
    expect(validateTariffDataset(d).join()).toMatch(/unknown source/);
  });

  it("provider-specific source for a provider not on the schedule", () => {
    const d = clone();
    (d.schedules[0] as unknown as { providerSourceIds: object }).providerSourceIds = { nope: ["sro-43-2026"] };
    expect(validateTariffDataset(d).join()).toMatch(/not on this schedule/);
  });

  it("unknown or duplicated provider-specific source", () => {
    const d = clone();
    (d.schedules[0] as unknown as { providerSourceIds: object }).providerSourceIds = {
      hazeco: ["does-not-exist"],
      lesco: ["sro-279-2026"],
    };
    const errors = validateTariffDataset(d).join();
    expect(errors).toMatch(/unknown source does-not-exist/);
    expect(errors).toMatch(/both shared and provider-specific/);
  });

  it("schedule without sources", () => {
    const d = clone();
    (d.schedules[0] as unknown as { sourceIds: string[] }).sourceIds = [];
    expect(validateTariffDataset(d).join()).toMatch(/no sources/);
  });

  it("invalid and impossible dates", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("12-02-2026")).toBe(false);
    const d = clone();
    (d.schedules[0] as unknown as { effectiveFrom: string }).effectiveFrom = "2026-02-30";
    expect(validateTariffDataset(d).join()).toMatch(/invalid effectiveFrom/);
  });

  it("effectiveTo before effectiveFrom", () => {
    const d = clone();
    (d.schedules[0] as unknown as { effectiveTo: string | null }).effectiveTo = "2026-01-01";
    expect(validateTariffDataset(d).join()).toMatch(/effectiveTo before effectiveFrom/);
  });

  it("missing provider", () => {
    const d = clone();
    (d.schedules[0] as unknown as { providers: string[] }).providers = [];
    expect(validateTariffDataset(d).join()).toMatch(/no providers/);
  });

  it("unknown provider", () => {
    const d = clone();
    (d.schedules[0] as unknown as { providers: string[] }).providers = ["acme"];
    expect(validateTariffDataset(d).join()).toMatch(/unknown provider/);
  });

  it("overlapping slabs", () => {
    const d = clone();
    const slabs = residential(d).bands[0].slabs as { fromUnits: number }[];
    slabs[1].fromUnits = 90;
    expect(validateTariffDataset(d).join()).toMatch(/gap or overlap/);
  });

  it("gap between slabs", () => {
    const d = clone();
    const slabs = residential(d).bands[0].slabs as { fromUnits: number }[];
    slabs[1].fromUnits = 105;
    expect(validateTariffDataset(d).join()).toMatch(/gap or overlap/);
  });

  it("negative and implausible rates", () => {
    expect(validateSlabs([{ fromUnits: 0, toUnits: null, ratePerUnit: -1 }], "x").join()).toMatch(/implausible/);
    expect(validateSlabs([{ fromUnits: 0, toUnits: null, ratePerUnit: 2244 }], "x").join()).toMatch(/implausible/);
    expect(validateSlabs([{ fromUnits: 0, toUnits: null, ratePerUnit: Number.NaN }], "x").join()).toMatch(/implausible/);
  });

  it("inverted or open-ended middle slab", () => {
    expect(
      validateSlabs(
        [
          { fromUnits: 0, toUnits: null, ratePerUnit: 1 },
          { fromUnits: 101, toUnits: 200, ratePerUnit: 2 },
        ],
        "x",
      ).join(),
    ).toMatch(/only the last slab may be open-ended/);
    expect(validateSlabs([{ fromUnits: 10, toUnits: 5, ratePerUnit: 1 }], "x").length).toBeGreaterThan(0);
  });

  it("slabs not starting at zero", () => {
    expect(validateSlabs([{ fromUnits: 1, toUnits: null, ratePerUnit: 1 }], "x").join()).toMatch(/start at 0/);
  });

  it("per-kW fixed charges without a rate", () => {
    const d = clone();
    const slabs = residential(d).bands[0].slabs as { fixedChargePerKwPerMonth?: number }[];
    delete slabs[2].fixedChargePerKwPerMonth;
    expect(validateTariffDataset(d).join()).toMatch(/missing fixedChargePerKwPerMonth/);
  });

  it("slabs that do not cover a band's unit limit", () => {
    const d = clone();
    const protectedBand = residential(d).bands.find((b) => b.id === "protected")! as { maxUnits?: number };
    protectedBand.maxUnits = 300;
    expect(validateTariffDataset(d).join()).toMatch(/do not cover maxUnits/);
  });

  it("duplicate tariff versions", () => {
    const d = clone();
    d.schedules = [d.schedules[0], structuredClone(d.schedules[0])];
    expect(validateTariffDataset(d).join()).toMatch(/duplicate schedule id/);
  });

  it("overlapping tariff versions for the same provider and months", () => {
    const d = clone();
    const second = structuredClone(d.schedules[0]) as TariffSchedule & { id: string };
    second.id = "another-version";
    d.schedules = [d.schedules[0], second];
    expect(validateTariffDataset(d).join()).toMatch(/overlap/);
  });

  it("double-counted adjustments in the same bill month", () => {
    const d = clone();
    const dup = { ...d.adjustments.adjustments[1], id: "fca-duplicate" };
    (d.adjustments as unknown as { adjustments: unknown[] }).adjustments = [...d.adjustments.adjustments, dup];
    expect(validateTariffDataset(d).join()).toMatch(/overlaps/);
  });

  it("adjustment with an unofficial source URL", () => {
    const d = clone();
    (d.sources[0] as unknown as { url: string }).url = "https://some-calculator-blog.example/rates";
    expect(validateTariffDataset(d).join()).toMatch(/official nepra\.org\.pk/);
  });

  it("invalid bill months", () => {
    const d = clone();
    (d.adjustments as unknown as { supportedBillingMonths: string[] }).supportedBillingMonths = ["2026-13"];
    expect(validateTariffDataset(d).join()).toMatch(/invalid month/);
  });
});

describe("fail-safe behaviour", () => {
  it("malformed data registers no engines (no estimates)", () => {
    const d = clone();
    (d.schedules[0] as unknown as { effectiveFrom: string }).effectiveFrom = "not-a-date";
    const original = console.error;
    console.error = () => {};
    try {
      expect(buildEngines(loadTariffData(d))).toEqual({});
    } finally {
      console.error = original;
    }
  });

  it("a provider removed from the schedule loses its engine", () => {
    const d = clone();
    (d.schedules[0] as unknown as { providers: string[] }).providers = ["lesco"];
    const s0 = d.schedules[0] as unknown as { providerSourceIds: object; peakHours: { providerId: string }[] };
    s0.providerSourceIds = { lesco: ["sro-46-2026"] };
    s0.peakHours = s0.peakHours.filter((h) => h.providerId === "lesco");
    const engines = buildEngines(loadTariffData(d));
    expect(Object.keys(engines)).toEqual(["lesco"]);
  });
});
