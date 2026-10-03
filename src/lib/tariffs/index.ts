import { adjustmentData } from "./data/adjustments";
import { sourceDocuments } from "./data/sources";
import { uniformSchedule2026Feb } from "./data/uniform-2026-02";
import type { AdjustmentDataset, SourceDocument, TariffSchedule } from "./types";
import {
  findOverlappingSchedules,
  validateAdjustments,
  validateSchedule,
  validateSourceAttribution,
  validateSources,
} from "./validate";

/**
 * All tariff versions, oldest first. Add a new schedule as a NEW file and
 * close the previous one by setting its `effectiveTo` / `lastBillingMonth`.
 * Never edit figures of a published version in place.
 */
export const tariffSchedules: readonly TariffSchedule[] = [uniformSchedule2026Feb];

export type TariffDataset = {
  schedules: readonly TariffSchedule[];
  adjustments: AdjustmentDataset;
  sources: readonly SourceDocument[];
};

export type LoadedTariffData =
  | { ok: true; data: TariffDataset }
  | { ok: false; errors: readonly string[] };

export function validateTariffDataset(data: TariffDataset): string[] {
  const sourceIds = new Set(data.sources.map((s) => s.id));
  return [
    ...validateSources(data.sources),
    ...data.schedules.flatMap((s) => validateSchedule(s, sourceIds)),
    ...findOverlappingSchedules(data.schedules),
    ...validateAdjustments(data.adjustments, sourceIds),
    ...validateSourceAttribution(data.schedules, data.adjustments, data.sources),
  ];
}

export function loadTariffData(
  data: TariffDataset = { schedules: tariffSchedules, adjustments: adjustmentData, sources: sourceDocuments },
): LoadedTariffData {
  const errors = validateTariffDataset(data);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, data };
}

export { adjustmentData, sourceDocuments };
export { getSourceDocument } from "./data/sources";
