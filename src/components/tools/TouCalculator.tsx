"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { routes } from "@/config/routes";
import { getProvider, isProviderId, type ProviderId } from "@/data/providers";
import { track } from "@/lib/analytics";
import { estimateTou, type TouCategoryId, type TouField, type TouResult } from "@/lib/calculator/tou";
import { parseNumber, parseOptionalNumber } from "@/lib/energy/parse";
import { cx } from "@/lib/cx";
import { formatDate, formatRupees, formatRupeesPrecise } from "@/lib/format";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select, describedBy } from "@/components/ui/Field";
import { SourceBlock } from "@/components/ui/SourceBlock";
import { NumberField, ResultFootnote, ResultHeadline, ResultPanel, ResultRows } from "./ToolParts";

const FIELD_ORDER: readonly TouField[] = ["providerId", "billingMonth", "peakUnits", "offPeakUnits", "sanctionedLoadKw", "mdiKw"];
const CATEGORIES: readonly { id: TouCategoryId; label: string; hint: string }[] = [
  { id: "residential", label: "Residential", hint: "Tariff A-1(b), 5 kW and above" },
  { id: "commercial", label: "Commercial", hint: "Tariff A-2(c), 5 kW and above" },
];

type Values = {
  providerId: string;
  categoryId: TouCategoryId;
  billingMonth: string;
  peakUnits: string;
  offPeakUnits: string;
  sanctionedLoadKw: string;
  mdiKw: string;
};

const UNITS_RULE = { min: 0, max: 1_000_000, integer: true, rangeMessage: "Units must be a whole number from 0 to 1,000,000." } as const;
const LOAD_RULE = { label: "Sanctioned load", min: 0, minExclusive: true, max: 5000, rangeMessage: "Sanctioned load must be more than 0 and no more than 5,000 kW." } as const;
const MDI_RULE = { label: "MDI", min: 0, max: 5000, rangeMessage: "MDI must be between 0 and 5,000 kW." } as const;

export function TouCalculator({
  providerIds,
  billingMonths,
  defaultBillingMonth,
}: {
  providerIds: readonly ProviderId[];
  billingMonths: readonly { value: string; label: string }[];
  defaultBillingMonth: string | null;
}) {
  const [values, setValues] = useState<Values>({
    providerId: "",
    categoryId: "residential",
    billingMonth: defaultBillingMonth ?? billingMonths.at(-1)?.value ?? "",
    peakUnits: "",
    offPeakUnits: "",
    sanctionedLoadKw: "",
    mdiKw: "",
  });
  const [errors, setErrors] = useState<Partial<Record<TouField, string>>>({});
  const [result, setResult] = useState<TouResult | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function fail(formErrors: Partial<Record<TouField, string>>) {
    setErrors(formErrors);
    setResult(null);
    setUnavailable(null);
    track({ name: "calculator_completed", tool: "tou-calculator", outcome: "invalid" });
    const first = FIELD_ORDER.find((f) => formErrors[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#tou-${first}`)?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    track({ name: "calculator_started", tool: "tou-calculator" });
    const formErrors: Partial<Record<TouField, string>> = {};
    if (!isProviderId(values.providerId)) formErrors.providerId = "Select your electricity provider.";
    const peak = parseNumber(values.peakUnits, { ...UNITS_RULE, label: "Peak units" });
    const offPeak = parseNumber(values.offPeakUnits, { ...UNITS_RULE, label: "Off-peak units" });
    const load = parseNumber(values.sanctionedLoadKw, LOAD_RULE);
    const mdi = parseOptionalNumber(values.mdiKw, MDI_RULE);
    if (!peak.ok) formErrors.peakUnits = peak.message;
    if (!offPeak.ok) formErrors.offPeakUnits = offPeak.message;
    if (!load.ok) formErrors.sanctionedLoadKw = load.message;
    if (!mdi.ok) formErrors.mdiKw = mdi.message;
    if (Object.keys(formErrors).length > 0 || !peak.ok || !offPeak.ok || !load.ok || !mdi.ok) return fail(formErrors);

    const outcome = estimateTou({
      providerId: values.providerId as ProviderId,
      categoryId: values.categoryId,
      billingMonth: values.billingMonth,
      peakUnits: peak.value,
      offPeakUnits: offPeak.value,
      sanctionedLoadKw: load.value,
      mdiKw: mdi.value,
    });
    if (outcome.status === "invalid") return fail(outcome.errors);
    setErrors({});
    if (outcome.status === "unavailable") {
      setResult(null);
      setUnavailable(outcome.message);
    } else {
      setUnavailable(null);
      setResult(outcome.result);
    }
    track({ name: "calculator_completed", tool: "tou-calculator", outcome: outcome.status === "success" ? "success" : "invalid" });
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
        <Field id="tou-providerId" label="Electricity provider" error={errors.providerId}>
          <Select
            id="tou-providerId"
            value={values.providerId}
            invalid={Boolean(errors.providerId)}
            aria-describedby={describedBy("tou-providerId", false, Boolean(errors.providerId))}
            onChange={(e) => update("providerId", e.target.value)}
            required
          >
            <option value="" disabled>
              Select your provider
            </option>
            {providerIds.map((id) => {
              const p = getProvider(id);
              return (
                <option key={id} value={id}>
                  {p.shortName === p.fullName ? p.fullName : `${p.shortName} (${p.fullName})`}
                </option>
              );
            })}
          </Select>
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink-900">Connection type</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.id}
                className={cx(
                  "flex cursor-pointer gap-3 rounded-[var(--radius-control)] border px-3.5 py-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600",
                  values.categoryId === c.id ? "border-brand-600 bg-brand-50" : "border-line-control",
                )}
              >
                <input
                  type="radio"
                  name="tou-category"
                  value={c.id}
                  checked={values.categoryId === c.id}
                  onChange={() => update("categoryId", c.id)}
                  className="mt-0.5 size-4 accent-brand-700"
                />
                <span>
                  <span className="block font-semibold text-ink-950">{c.label}</span>
                  <span className="block text-ink-600">{c.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="tou-billingMonth" label="Bill month" error={errors.billingMonth}>
          <Select
            id="tou-billingMonth"
            value={values.billingMonth}
            invalid={Boolean(errors.billingMonth)}
            onChange={(e) => update("billingMonth", e.target.value)}
          >
            {billingMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="tou-peakUnits"
            label="Peak units"
            integer
            value={values.peakUnits}
            onChange={(v) => update("peakUnits", v)}
            error={errors.peakUnits}
            suffix="kWh"
            placeholder="From your bill"
          />
          <NumberField
            id="tou-offPeakUnits"
            label="Off-peak units"
            integer
            value={values.offPeakUnits}
            onChange={(v) => update("offPeakUnits", v)}
            error={errors.offPeakUnits}
            suffix="kWh"
            placeholder="From your bill"
          />
          <NumberField
            id="tou-sanctionedLoadKw"
            label="Sanctioned load"
            value={values.sanctionedLoadKw}
            onChange={(v) => update("sanctionedLoadKw", v)}
            error={errors.sanctionedLoadKw}
            suffix="kW"
            placeholder="e.g. 7"
            help="5 kW or more. Printed on your bill."
          />
          <NumberField
            id="tou-mdiKw"
            label="Maximum demand (MDI)"
            optional
            value={values.mdiKw}
            onChange={(v) => update("mdiKw", v)}
            error={errors.mdiKw}
            suffix="kW"
            placeholder="e.g. 4.2"
            help="The highest demand your meter recorded this month, if shown on your bill."
          />
        </div>

        <Button type="submit" size="lg" fullWidth>
          Calculate TOU Bill
        </Button>
      </form>

      <ResultPanel
        headingId="tou-result-heading"
        title="Your time-of-use estimate"
        regionRef={resultRef}
        idle="Enter the peak and off-peak units from your bill, your sanctioned load and, if known, your MDI, then choose Calculate TOU Bill."
      >
        {unavailable ? (
          <Alert tone="warning" title="Estimate not available">
            <p>{unavailable}</p>
          </Alert>
        ) : result ? (
          <TouResultView result={result} />
        ) : null}
      </ResultPanel>
    </div>
  );
}

function TouResultView({ result }: { result: TouResult }) {
  return (
    <div className="space-y-4">
      <ResultHeadline
        label="Estimated bill before taxes"
        value={formatRupees(result.total)}
        note={`${result.tariffLabel}, tariff ${result.tariffReference}. ${result.totalUnits.toLocaleString("en-PK")} units in total${
          result.effectiveCostPerUnit !== null ? `, about ${formatRupeesPrecise(result.effectiveCostPerUnit)} per unit` : ""
        }.`}
      />
      <ResultRows
        rows={result.lines.map((l) => ({
          key: l.id,
          label: (
            <>
              <span className="block text-ink-800">{l.label}</span>
              {l.detail ? <span className="block text-xs text-ink-500">{l.detail}</span> : null}
            </>
          ),
          value: formatRupeesPrecise(l.amount),
        }))}
      />
      {result.pendingAdjustments.map((p) => (
        <Alert key={p.kind} tone="warning" title={`${p.label}: not yet notified`}>
          <p>{p.message}</p>
        </Alert>
      ))}
      <details className="rounded-xl border border-line p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-ink-900">How this was worked out</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-600">
          {[...result.steps, ...result.assumptions].map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-3 font-semibold text-ink-900">Not included</p>
        <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-ink-600">
          {result.exclusions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </details>
      <SourceBlock
        title={`Tariff in force from ${formatDate(result.tariff.effectiveFrom)}`}
        sources={[...result.tariff.sources, ...result.adjustmentSources]}
        lastVerifiedOn={result.tariff.lastVerifiedOn}
      />
      <ResultFootnote>
        This is an estimate, not an official bill. To see your actual bill,{" "}
        <Link href={routes.billCheck} className="font-semibold text-brand-700 underline underline-offset-2">
          check it online
        </Link>
        .
      </ResultFootnote>
    </div>
  );
}
