import { describe, it } from "node:test";
import { expect } from "./support/expect";
import { createScheduleEngine, findSchedule } from "@/lib/calculator/schedule-engine";
import type { TariffDataset } from "@/lib/tariffs";
import { validateTariffDataset } from "@/lib/tariffs";
import type { AdjustmentDataset, SourceDocument, TariffSchedule } from "@/lib/tariffs/types";

/**
 * TEST FIXTURES ONLY. These figures are deliberately simple and are not real
 * tariffs; they exercise versioning and provider-specific behaviour.
 */
const source: SourceDocument = {
  id: "fixture-source",
  kind: "uniform-tariff",
  appliesTo: "all",
  effectiveFrom: "2026-01-01",
  reference: "S.R.O. 1(I)/2000", // fixture, not a real notification
  title: "Test fixture",
  publisher: "Test",
  publishedOn: "2026-01-01",
  url: "https://nepra.org.pk/test-fixture.pdf",
};

function schedule(id: string, providers: TariffSchedule["providers"], rate: number, first: string, last: string | null): TariffSchedule {
  return {
    id,
    title: id,
    providers,
    effectiveFrom: `${first}-01`,
    effectiveTo: null,
    firstBillingMonth: first,
    lastBillingMonth: last,
    lastVerifiedOn: "2026-01-01",
    sourceIds: ["fixture-source"],
    categories: [
      {
        categoryId: "commercial",
        sanctionedLoadBelowKw: 5,
        defaultBandId: "flat",
        notes: [],
        bands: [
          {
            id: "flat",
            label: "Flat",
            description: "Fixture",
            tariffReference: "TEST",
            pricing: "single-slab",
            fixedCharge: { kind: "none" },
            slabs: [{ fromUnits: 0, toUnits: null, ratePerUnit: rate }],
          },
        ],
      },
    ],
  };
}

const adjustments: AdjustmentDataset = {
  supportedBillingMonths: ["2026-01", "2026-02", "2026-03", "2026-04"],
  expectedKinds: [],
  fcaBillingLagMonths: 2,
  lastVerifiedOn: "2026-01-01",
  adjustments: [],
};

const data: TariffDataset = {
  sources: [source],
  adjustments,
  schedules: [
    schedule("v1", ["lesco"], 10, "2026-01", "2026-02"),
    schedule("v2", ["lesco"], 20, "2026-03", null),
    schedule("ke-only", ["ke"], 15, "2026-02", null),
  ],
};

const commercial = (providerId: "lesco" | "ke", billingMonth: string) => ({
  providerId,
  consumerCategoryId: "commercial" as const,
  unitsConsumed: 100,
  billingMonth,
  sanctionedLoadKw: 1,
});

describe("tariff versioning", () => {
  it("fixture dataset is itself valid", () => {
    expect(validateTariffDataset(data)).toEqual([]);
  });

  it("selects the version in force for the bill month", () => {
    const engine = createScheduleEngine("lesco", data);
    const jan = engine.calculate(commercial("lesco", "2026-01"));
    const mar = engine.calculate(commercial("lesco", "2026-03"));
    expect(jan.status === "success" && jan.result.total).toBe(1000);
    expect(jan.status === "success" && jan.result.tariff.id).toBe("v1");
    expect(mar.status === "success" && mar.result.total).toBe(2000);
    expect(mar.status === "success" && mar.result.tariff.id).toBe("v2");
  });

  it("never mixes periods: the last month of v1 still uses v1", () => {
    expect(findSchedule(data.schedules, "lesco", "2026-02")?.id).toBe("v1");
    expect(findSchedule(data.schedules, "lesco", "2026-03")?.id).toBe("v2");
  });

  it("before any tariff (future-dated version) → unavailable, not a guess", () => {
    const engine = createScheduleEngine("ke", data);
    const outcome = engine.calculate(commercial("ke", "2026-01"));
    expect(outcome.status).toBe("unavailable");
    if (outcome.status === "unavailable") expect(outcome.reason).toBe("tariff-data-missing");
  });

  it("after an expired version with no successor → unavailable", () => {
    const expiredOnly: TariffDataset = { ...data, schedules: [schedule("old", ["lesco"], 10, "2026-01", "2026-01")] };
    const outcome = createScheduleEngine("lesco", expiredOnly).calculate(commercial("lesco", "2026-02"));
    expect(outcome.status).toBe("unavailable");
  });

  it("providers can have different rules", () => {
    const lesco = createScheduleEngine("lesco", data).calculate(commercial("lesco", "2026-02"));
    const ke = createScheduleEngine("ke", data).calculate(commercial("ke", "2026-02"));
    expect(lesco.status === "success" && lesco.result.total).toBe(1000);
    expect(ke.status === "success" && ke.result.total).toBe(1500);
  });

  it("only offers bill months that have a tariff", () => {
    const ke = createScheduleEngine("ke", data).requirementsFor("commercial");
    expect(ke?.billingMonths.map((m) => m.value)).toEqual(["2026-02", "2026-03", "2026-04"]);
  });

  it("reports pending adjustments when an expected kind is missing", () => {
    const withExpected: TariffDataset = { ...data, adjustments: { ...adjustments, expectedKinds: ["fca", "qta"] } };
    const outcome = createScheduleEngine("lesco", withExpected).calculate(commercial("lesco", "2026-03"));
    expect(outcome.status).toBe("success");
    if (outcome.status === "success") {
      expect(outcome.result.pendingAdjustments.map((p) => p.kind)).toEqual(["fca", "qta"]);
      expect(outcome.result.pendingAdjustments[0].message).toContain("January 2026");
      expect(outcome.result.total).toBe(2000);
    }
  });
});
