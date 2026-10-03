import { describe, it } from "node:test";
import { expect } from "./support/expect";
import { adjustmentData, sourceDocuments, tariffSchedules, validateTariffDataset, type TariffDataset } from "@/lib/tariffs";

type MutableSource = { id: string; reference: string; kind: string; appliesTo: unknown; effectiveFrom?: string };
type MutableSchedule = { sourceIds: string[]; providerSourceIds: Record<string, string[]>; peakHours: { providerId: string; sourceId: string }[] };
type MutableAdjustment = { id: string; sourceId: string };

const clone = () =>
  structuredClone({ schedules: tariffSchedules, adjustments: adjustmentData, sources: sourceDocuments }) as TariffDataset;
const src = (d: TariffDataset, id: string) => (d.sources as unknown as MutableSource[]).find((s) => s.id === id)!;
const sched = (d: TariffDataset) => d.schedules[0] as unknown as MutableSchedule;
const errors = (d: TariffDataset) => validateTariffDataset(d).join("\n");

describe("source validation", () => {
  it("live data passes", () => {
    expect(validateTariffDataset(clone())).toEqual([]);
  });

  it("rejects a missing or malformed notification number", () => {
    const d = clone();
    src(d, "fca-2026-07").reference = "";
    src(d, "qta-2026-q1").reference = "SRO 953/2026";
    expect((errors(d).match(/notification number missing/g) ?? []).length).toBe(2);
  });

  it("rejects a tariff notification without an effective date", () => {
    const d = clone();
    delete src(d, "sro-43-2026").effectiveFrom;
    expect(errors(d)).toMatch(/sro-43-2026.*without effectiveFrom/);
  });

  it("rejects an invalid kind", () => {
    const d = clone();
    src(d, "sro-279-2026").kind = "blog";
    expect(errors(d)).toMatch(/invalid kind/);
  });

  it("rejects the same notification registered twice", () => {
    const d = clone();
    (d.sources as unknown as MutableSource[]).push({ ...src(d, "sro-43-2026"), id: "sro-43-copy" });
    expect(errors(d)).toMatch(/duplicate source/);
  });

  it("a provider notification must name exactly one provider", () => {
    const d = clone();
    src(d, "sro-46-2026").appliesTo = ["lesco", "iesco"];
    expect(errors(d)).toMatch(/exactly one provider/);
  });

  it("rejects a company's notification used as a shared source", () => {
    const d = clone();
    sched(d).sourceIds.push("sro-46-2026");
    delete sched(d).providerSourceIds.lesco;
    expect(errors(d)).toMatch(/shared source sro-46-2026 is not a uniform tariff/);
  });

  it("rejects attributing one company's notification to another", () => {
    const d = clone();
    sched(d).providerSourceIds.iesco = ["sro-43-2026"];
    expect(errors(d)).toMatch(/sro-43-2026 does not apply to iesco/);
  });

  it("rejects peak hours cited from another company's notification", () => {
    const d = clone();
    sched(d).peakHours[0].providerId = "mepco";
    expect(errors(d)).toMatch(/peak hours source sro-41-2026 does not apply to mepco/); // FESCO hours claimed for MEPCO
  });

  it("rejects an adjustment citing the wrong kind of decision", () => {
    const d = clone();
    (d.adjustments.adjustments as unknown as MutableAdjustment[]).find((a) => a.id === "qta-2026-q2")!.sourceId = "fca-2026-07";
    expect(errors(d)).toMatch(/cites a fca document for a qta adjustment/);
  });
});
