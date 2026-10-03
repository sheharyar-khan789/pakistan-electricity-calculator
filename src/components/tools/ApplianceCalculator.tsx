"use client";

import { useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { energyCost, totalApplianceEnergy, type ApplianceTotal } from "@/lib/energy/calculate";
import { formatEstimatedCost, formatKwh } from "@/lib/energy/format";
import type { RateOptions } from "@/lib/energy/tariff-rates";
import {
  validateApplianceRow,
  validateRate,
  type ApplianceField,
  type ApplianceFormValues,
  type FieldErrors,
} from "@/lib/energy/validate";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { RateField } from "./RateField";
import { NumberField, ResultFootnote, ResultHeadline, ResultPanel, ResultRows } from "./ToolParts";

export const MAX_APPLIANCES = 15;
const FIELDS: readonly ApplianceField[] = ["watts", "quantity", "hoursPerDay", "daysPerMonth"];

type Row = ApplianceFormValues & { key: number; name: string };
type Outcome = { total: ApplianceTotal; names: string[]; rate: number | null };

// Keys are per component instance, so server and client render the same ids.
const newRow = (key: number): Row => ({ key, name: "", watts: "", quantity: "1", hoursPerDay: "", daysPerMonth: "30" });

export function ApplianceCalculator({ rateOptions }: { rateOptions: RateOptions | null }) {
  const [rows, setRows] = useState<Row[]>(() => [newRow(0)]);
  const nextKey = useRef(1);
  const [rate, setRate] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<number, FieldErrors<ApplianceField>>>({});
  const [rateError, setRateError] = useState<string>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function update(key: number, field: ApplianceField | "name", value: string) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
    if (field !== "name") setRowErrors((e) => ({ ...e, [key]: { ...e[key], [field]: undefined } }));
  }

  function addRow() {
    const row = newRow(nextKey.current++);
    setRows((rs) => [...rs, row]);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`#app-${row.key}-name`)?.focus());
  }

  function removeRow(key: number) {
    setRows((rs) => rs.filter((r) => r.key !== key));
    setRowErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    track({ name: "calculator_started", tool: "appliance-calculator" });
    const parsed = rows.map((r) => validateApplianceRow(r));
    const rateResult = validateRate(rate);
    const errors: Record<number, FieldErrors<ApplianceField>> = {};
    parsed.forEach((p, i) => {
      if (!p.ok) errors[rows[i].key] = p.errors;
    });
    setRowErrors(errors);
    setRateError(rateResult.ok ? undefined : rateResult.message);

    if (Object.keys(errors).length > 0 || !rateResult.ok) {
      setOutcome(null);
      track({ name: "calculator_completed", tool: "appliance-calculator", outcome: "invalid" });
      const firstRow = rows.find((r) => errors[r.key]);
      const target = firstRow
        ? `#app-${firstRow.key}-${FIELDS.find((f) => errors[firstRow.key][f])}`
        : "#app-rate";
      formRef.current?.querySelector<HTMLElement>(target)?.focus();
      return;
    }

    const uses = parsed.map((p) => (p.ok ? p.input : null)).filter((u) => u !== null);
    setOutcome({
      total: totalApplianceEnergy(uses),
      names: rows.map((r, i) => r.name.trim() || `Appliance ${i + 1}`),
      rate: rateResult.value,
    });
    track({ name: "calculator_completed", tool: "appliance-calculator", outcome: "success" });
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        className="space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      >
        <ol className="space-y-5">
          {rows.map((row, index) => {
            const errors = rowErrors[row.key] ?? {};
            const id = (f: string) => `app-${row.key}-${f}`;
            return (
              <li key={row.key}>
                <fieldset className="space-y-4 rounded-xl border border-line p-4">
                  <legend className="px-1 text-sm font-semibold text-ink-900">Appliance {index + 1}</legend>
                  <Field id={id("name")} label="Name" optional>
                    <Input
                      id={id("name")}
                      type="text"
                      maxLength={40}
                      autoComplete="off"
                      value={row.name}
                      placeholder="e.g. Ceiling fan"
                      onChange={(e) => update(row.key, "name", e.target.value)}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      id={id("watts")}
                      label="Power"
                      value={row.watts}
                      onChange={(v) => update(row.key, "watts", v)}
                      error={errors.watts}
                      suffix="watts"
                      placeholder="From the rating label"
                    />
                    <NumberField
                      id={id("quantity")}
                      label="Quantity"
                      integer
                      value={row.quantity}
                      onChange={(v) => update(row.key, "quantity", v)}
                      error={errors.quantity}
                    />
                    <NumberField
                      id={id("hoursPerDay")}
                      label="Hours per day"
                      value={row.hoursPerDay}
                      onChange={(v) => update(row.key, "hoursPerDay", v)}
                      error={errors.hoursPerDay}
                      suffix="hours"
                      placeholder="e.g. 8"
                    />
                    <NumberField
                      id={id("daysPerMonth")}
                      label="Days per month"
                      integer
                      value={row.daysPerMonth}
                      onChange={(v) => update(row.key, "daysPerMonth", v)}
                      error={errors.daysPerMonth}
                      suffix="days"
                    />
                  </div>
                  {rows.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.key)}>
                      <TrashIcon className="size-4" />
                      Remove appliance {index + 1}
                    </Button>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {rows.length < MAX_APPLIANCES ? (
          <Button type="button" variant="secondary" fullWidth onClick={addRow}>
            <PlusIcon className="size-4" />
            Add another appliance
          </Button>
        ) : (
          <p className="text-sm text-ink-500">You can add up to {MAX_APPLIANCES} appliances.</p>
        )}

        <RateField id="app-rate" value={rate} onChange={(v) => { setRate(v); setRateError(undefined); }} error={rateError} rateOptions={rateOptions} />

        <Button type="submit" size="lg" fullWidth>
          Calculate Usage
        </Button>
      </form>

      <ResultPanel
        headingId="appliance-result-heading"
        title="Appliance usage"
        regionRef={resultRef}
        idle="Enter each appliance’s power in watts (from its rating label), how many you have and how long they run, then choose Calculate Usage."
        className="lg:sticky lg:top-24"
      >
        {outcome ? <ApplianceResult outcome={outcome} /> : null}
      </ResultPanel>
    </div>
  );
}

function ApplianceResult({ outcome }: { outcome: Outcome }) {
  const { total, names, rate } = outcome;
  return (
    <>
      <ResultHeadline
        label={rate === null ? "Estimated units per month" : "Estimated monthly cost"}
        value={rate === null ? formatKwh(total.monthlyKwh) : formatEstimatedCost(energyCost(total.monthlyKwh, rate))}
        note={
          rate === null
            ? "Add a rate per unit to see an estimated cost."
            : `${formatKwh(total.monthlyKwh)} × Rs. ${rate.toFixed(2)} per unit. Excludes fixed charges and taxes.`
        }
      />
      <ResultRows
        rows={[
          { key: "day", label: "Units per day (kWh)", value: formatKwh(total.dailyKwh) },
          { key: "month", label: "Units per month (kWh)", value: formatKwh(total.monthlyKwh) },
          ...(total.items.length > 1
            ? total.items.map((item, i) => ({
                key: `item-${i}`,
                label: names[i],
                value: rate === null ? `${formatKwh(item.monthlyKwh)}/month` : `${formatKwh(item.monthlyKwh)} · ${formatEstimatedCost(energyCost(item.monthlyKwh, rate))}`,
              }))
            : []),
        ]}
      />
      <ResultFootnote>
        Uses the power you entered for every hour of use. Appliances that cycle on and off (fridges, ACs, irons, water
        pumps with tanks) usually use less than this.
      </ResultFootnote>
    </>
  );
}
