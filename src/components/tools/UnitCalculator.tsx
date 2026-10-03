"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { routes } from "@/config/routes";
import { track } from "@/lib/analytics";
import { DAYS_IN_PROJECTED_MONTH, unitsFromReadings, type ReadingsResult } from "@/lib/energy/calculate";
import { formatKwh, formatKwhNumber } from "@/lib/energy/format";
import { validateReadingsForm, type FieldErrors, type ReadingsField, type ReadingsFormValues } from "@/lib/energy/validate";
import { Button } from "@/components/ui/Button";
import { NumberField, ResultFootnote, ResultHeadline, ResultPanel, ResultRows } from "./ToolParts";

const FIELD_ORDER: readonly ReadingsField[] = ["previousReading", "currentReading", "billingDays"];
const EMPTY: ReadingsFormValues = { previousReading: "", currentReading: "", billingDays: "" };

type Success = Extract<ReadingsResult, { ok: true }>;

export function UnitCalculator() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<ReadingsField>>({});
  const [result, setResult] = useState<Success | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function update(field: ReadingsField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    track({ name: "calculator_started", tool: "unit-calculator" });
    const validation = validateReadingsForm(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      setResult(null);
      track({ name: "calculator_completed", tool: "unit-calculator", outcome: "invalid" });
      const first = FIELD_ORDER.find((f) => validation.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#unit-${first}`)?.focus();
      return;
    }
    const outcome = unitsFromReadings(validation.input);
    if (!outcome.ok) return; // Ruled out by validation.
    setErrors({});
    setResult(outcome);
    track({ name: "calculator_completed", tool: "unit-calculator", outcome: "success" });
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        className="space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="unit-previousReading"
            label="Previous reading"
            value={values.previousReading}
            onChange={(v) => update("previousReading", v)}
            error={errors.previousReading}
            suffix="kWh"
            placeholder="e.g. 10250"
          />
          <NumberField
            id="unit-currentReading"
            label="Current reading"
            value={values.currentReading}
            onChange={(v) => update("currentReading", v)}
            error={errors.currentReading}
            suffix="kWh"
            placeholder="e.g. 10560"
          />
        </div>
        <NumberField
          id="unit-billingDays"
          label="Days between the readings"
          optional
          integer
          value={values.billingDays}
          onChange={(v) => update("billingDays", v)}
          error={errors.billingDays}
          suffix="days"
          placeholder="e.g. 30"
          help="Add this to see your daily average and a 30-day projection."
        />
        <Button type="submit" size="lg" fullWidth>
          Calculate Units
        </Button>
      </form>

      <ResultPanel
        headingId="unit-result-heading"
        title="Units used"
        regionRef={resultRef}
        idle="Enter your previous and current meter readings and choose Calculate Units. 1 unit = 1 kWh."
      >
        {result ? (
          <>
            <ResultHeadline
              label="Units used between the readings"
              value={`${formatKwhNumber(result.units)} units`}
              note="1 unit = 1 kilowatt-hour (kWh)."
            />
            <ResultRows
              rows={[
                { key: "units", label: "Units (kWh)", value: formatKwh(result.units) },
                {
                  key: "avg",
                  label: "Average per day",
                  value: result.averagePerDay === null ? "Add days to see" : formatKwh(result.averagePerDay),
                },
                {
                  key: "month",
                  label: `Estimated units per ${DAYS_IN_PROJECTED_MONTH}-day month`,
                  value: result.projectedMonthlyUnits === null ? "Add days to see" : formatKwh(result.projectedMonthlyUnits),
                },
              ]}
            />
            <ResultFootnote>
              The monthly figure assumes you keep using electricity at the same daily rate. Want a rupee figure?
              Enter these units in the <Link href={routes.electricityBillCalculator} className="font-semibold text-brand-700 underline underline-offset-2">electricity bill calculator</Link>.
            </ResultFootnote>
          </>
        ) : null}
      </ResultPanel>
    </div>
  );
}
