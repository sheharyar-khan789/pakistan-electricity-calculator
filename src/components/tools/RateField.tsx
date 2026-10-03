"use client";

import { useId } from "react";
import type { RateOptions } from "@/lib/energy/tariff-rates";
import { formatRupeesPrecise } from "@/lib/format";
import { Field, Select } from "@/components/ui/Field";
import { NumberField } from "./ToolParts";

type RateFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Verified tariff slab rates, or null if none are available. */
  rateOptions: RateOptions | null;
};

/**
 * Rate per unit for a cost estimate. The user types their own rate, or fills
 * it from one verified tariff slab. Nothing is pre-filled: there is no single
 * official rate for every household.
 */
export function RateField({ id, value, onChange, error, rateOptions }: RateFieldProps) {
  const presetId = `${id}-preset`;
  const presetHelpId = `${useId()}-preset-help`;
  const groups = rateOptions
    ? [...new Set(rateOptions.options.map((o) => o.group))].map((group) => ({
        group,
        options: rateOptions.options.filter((o) => o.group === group),
      }))
    : [];

  return (
    <div className="space-y-3 rounded-xl border border-line bg-ink-50/60 p-4">
      <NumberField
        id={id}
        label="Rate per unit"
        optional
        value={value}
        onChange={onChange}
        error={error}
        suffix="Rs/kWh"
        placeholder="e.g. 45"
        help="Leave empty to see units only. A simple rate from your own bill: total bill ÷ units billed."
      />
      {rateOptions && groups.length > 0 ? (
        <Field id={presetId} label="Or fill in an official tariff rate" optional>
          <Select
            id={presetId}
            value=""
            aria-describedby={presetHelpId}
            onChange={(event) => {
              const option = rateOptions.options.find((o) => o.id === event.target.value);
              if (option) onChange(option.ratePerUnit.toFixed(2));
            }}
          >
            <option value="">Choose your tariff slab…</option>
            {groups.map(({ group, options }) => (
              <optgroup key={group} label={group}>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label.replace(`${group} · `, "")}: {formatRupeesPrecise(o.ratePerUnit)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <p id={presetHelpId} className="text-[0.8125rem] leading-relaxed text-ink-500">
            Estimate only: base energy rate
            {rateOptions.adjustmentsText ? ` plus the ${rateOptions.adjustmentsText}` : ""} for{" "}
            {rateOptions.billingMonthLabel} bills, from {rateOptions.references.join(", ")}.
            {rateOptions.pendingText ? ` The ${rateOptions.pendingText} for that month has not been notified yet.` : ""}{" "}
            Excludes fixed charges and taxes. Your slab depends on your household’s total monthly units.
          </p>
        </Field>
      ) : null}
    </div>
  );
}
