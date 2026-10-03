"use client";

import { useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { acEnergy, energyCost, type AcUse, type ApplianceEnergy } from "@/lib/energy/calculate";
import { formatEstimatedCost, formatKwh } from "@/lib/energy/format";
import type { RateOptions } from "@/lib/energy/tariff-rates";
import { validateAcForm, validateRate, type AcField, type AcFormValues, type FieldErrors } from "@/lib/energy/validate";
import { cx } from "@/lib/cx";
import { Button } from "@/components/ui/Button";
import { RateField } from "./RateField";
import { NumberField, ResultFootnote, ResultHeadline, ResultPanel, ResultRows } from "./ToolParts";

const FIELD_ORDER: readonly AcField[] = ["power", "quantity", "hoursPerDay", "daysPerMonth", "runningShare"];
const INITIAL: AcFormValues = {
  power: "",
  powerUnit: "W",
  quantity: "1",
  hoursPerDay: "",
  daysPerMonth: "30",
  runningShare: "100",
};

type Outcome = { use: AcUse; energy: ApplianceEnergy; rate: number | null };

export function AcCalculator({ rateOptions }: { rateOptions: RateOptions | null }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState<FieldErrors<AcField>>({});
  const [rate, setRate] = useState("");
  const [rateError, setRateError] = useState<string>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function update(field: AcField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    track({ name: "calculator_started", tool: "ac-calculator" });
    const validation = validateAcForm(values);
    const rateResult = validateRate(rate);
    setRateError(rateResult.ok ? undefined : rateResult.message);
    if (!validation.ok || !rateResult.ok) {
      const formErrors = validation.ok ? {} : validation.errors;
      setErrors(formErrors);
      setOutcome(null);
      track({ name: "calculator_completed", tool: "ac-calculator", outcome: "invalid" });
      const first = FIELD_ORDER.find((f) => formErrors[f]);
      formRef.current?.querySelector<HTMLElement>(first ? `#ac-${first}` : "#ac-rate")?.focus();
      return;
    }
    setErrors({});
    setOutcome({ use: validation.input, energy: acEnergy(validation.input), rate: rateResult.value });
    track({ name: "calculator_completed", tool: "ac-calculator", outcome: "success" });
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  const unit = values.powerUnit;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        className="space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink-900">Power is given in</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["W", "kW"] as const).map((option) => (
              <label
                key={option}
                className={cx(
                  "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border px-3.5 py-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600",
                  unit === option ? "border-brand-600 bg-brand-50 font-semibold text-ink-950" : "border-line-control text-ink-700",
                )}
              >
                <input
                  type="radio"
                  name="ac-power-unit"
                  value={option}
                  checked={unit === option}
                  onChange={() => {
                    setValues((v) => ({ ...v, powerUnit: option }));
                    setErrors((e) => ({ ...e, power: undefined }));
                  }}
                  className="size-4 accent-brand-700"
                />
                {option === "W" ? "Watts (W)" : "Kilowatts (kW)"}
              </label>
            ))}
          </div>
        </fieldset>

        <NumberField
          id="ac-power"
          label="Rated input power"
          value={values.power}
          onChange={(v) => update("power", v)}
          error={errors.power}
          suffix={unit}
          placeholder={unit === "W" ? "e.g. 1800" : "e.g. 1.8"}
          help="The electrical input power on the indoor unit’s rating label or in the manual. Not the cooling capacity (BTU/h or tons)."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="ac-quantity"
            label="Number of ACs"
            integer
            value={values.quantity}
            onChange={(v) => update("quantity", v)}
            error={errors.quantity}
          />
          <NumberField
            id="ac-hoursPerDay"
            label="Hours per day"
            value={values.hoursPerDay}
            onChange={(v) => update("hoursPerDay", v)}
            error={errors.hoursPerDay}
            suffix="hours"
            placeholder="e.g. 8"
          />
          <NumberField
            id="ac-daysPerMonth"
            label="Days per month"
            integer
            value={values.daysPerMonth}
            onChange={(v) => update("daysPerMonth", v)}
            error={errors.daysPerMonth}
            suffix="days"
          />
          <NumberField
            id="ac-runningShare"
            label="Time at rated power"
            value={values.runningShare}
            onChange={(v) => update("runningShare", v)}
            error={errors.runningShare}
            suffix="%"
            help="Share of switched-on time the AC draws its rated power. 100% assumes it draws it the whole time. Change it only if you have measured it, e.g. with a plug-in energy meter."
          />
        </div>

        <RateField id="ac-rate" value={rate} onChange={(v) => { setRate(v); setRateError(undefined); }} error={rateError} rateOptions={rateOptions} />

        <Button type="submit" size="lg" fullWidth>
          Calculate AC Cost
        </Button>
      </form>

      <ResultPanel
        headingId="ac-result-heading"
        title="AC electricity use"
        regionRef={resultRef}
        idle="Enter your AC’s rated input power and how long it runs, then choose Calculate AC Cost."
        className="lg:sticky lg:top-24"
      >
        {outcome ? <AcResult outcome={outcome} /> : null}
      </ResultPanel>
    </div>
  );
}

function AcResult({ outcome }: { outcome: Outcome }) {
  const { use, energy, rate } = outcome;
  const fullPower = use.runningSharePercent === 100;
  return (
    <>
      <ResultHeadline
        label={rate === null ? "Estimated units per month" : "Estimated monthly cost"}
        value={rate === null ? formatKwh(energy.monthlyKwh) : formatEstimatedCost(energyCost(energy.monthlyKwh, rate))}
        note={
          rate === null
            ? "Add a rate per unit to see an estimated cost."
            : `${formatKwh(energy.monthlyKwh)} × Rs. ${rate.toFixed(2)} per unit. Excludes fixed charges and taxes.`
        }
      />
      <ResultRows
        rows={[
          { key: "day", label: "Units per day (kWh)", value: formatKwh(energy.dailyKwh) },
          { key: "month", label: "Units per month (kWh)", value: formatKwh(energy.monthlyKwh) },
          ...(rate === null
            ? []
            : [{ key: "day-cost", label: "Estimated cost per day", value: formatEstimatedCost(energyCost(energy.dailyKwh, rate)) }]),
        ]}
      />
      <ResultFootnote>
        {fullPower
          ? "Full-power estimate: it assumes the AC draws its rated input power for every hour it is on. Real use differs, because the compressor cycles or (in inverter models) changes speed with weather, thermostat setting, room size and insulation."
          : `Assumes the AC draws its rated input power ${use.runningSharePercent}% of the time it is on. Real use varies with weather, thermostat setting and the unit itself.`}
      </ResultFootnote>
    </>
  );
}
