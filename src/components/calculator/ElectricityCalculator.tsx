"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import {
  consumerCategories,
  DEFAULT_CONSUMER_CATEGORY,
  getConsumerCategory,
  isConsumerCategoryId,
} from "@/data/consumer-categories";
import { getProvider, isProviderId, providers, type ProviderId } from "@/data/providers";
import { track } from "@/lib/analytics";
import { calculateBill } from "@/lib/calculator/calculate";
import {
  getCategoryRequirements,
  getEngine,
  isCalculatorAvailable,
} from "@/lib/calculator/engine-registry";
import type { CalculationInput, CalculationOutcome, FieldErrors } from "@/lib/calculator/types";
import {
  validateCalculatorForm,
  type CalculatorFieldName,
  type CalculatorFormErrors,
  type CalculatorFormValues,
  type UnitsInputMode,
} from "@/lib/calculator/validation";
import { cx } from "@/lib/cx";
import { Button } from "@/components/ui/Button";
import { describedBy, Field, Input, Select } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/States";
import { InfoIcon } from "@/components/icons";
import { EstimateResult, type CalculatorPhase } from "./EstimateResult";

type ElectricityCalculatorProps = {
  /** "split" puts the result beside the form on large screens. */
  layout?: "stacked" | "split";
  /** Pre-select a provider (provider calculator pages). */
  initialProviderId?: ProviderId;
  /** Bill month to preselect ("YYYY-MM"), computed on the server. */
  defaultBillingMonth?: string | null;
};

const FIELD_ORDER: readonly CalculatorFieldName[] = [
  "providerId",
  "consumerCategoryId",
  "bandId",
  "sanctionedLoad",
  "billingMonth",
  "units",
  "previousReading",
  "currentReading",
];

function engineErrorsToFormErrors(errors: FieldErrors, mode: UnitsInputMode): CalculatorFormErrors {
  const unitsError = errors.unitsConsumed ?? errors.form;
  return {
    providerId: errors.providerId,
    consumerCategoryId: errors.consumerCategoryId,
    billingMonth: errors.billingMonth,
    bandId: errors.bandId,
    sanctionedLoad: errors.sanctionedLoadKw,
    ...(mode === "units" ? { units: unitsError } : { currentReading: unitsError }),
  };
}

export function ElectricityCalculator({
  layout = "split",
  initialProviderId,
  defaultBillingMonth,
}: ElectricityCalculatorProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<CalculatorFormValues>({
    providerId: initialProviderId ?? "",
    consumerCategoryId: DEFAULT_CONSUMER_CATEGORY,
    billingMonth: defaultBillingMonth ?? "",
    bandId: "",
    sanctionedLoad: "",
    inputMode: "units",
    units: "",
    previousReading: "",
    currentReading: "",
  });
  const [errors, setErrors] = useState<CalculatorFormErrors>({});
  const [phase, setPhase] = useState<CalculatorPhase>({ kind: "idle" });
  const [lastRun, setLastRun] = useState<{ input: CalculationInput; unitsSource: UnitsInputMode } | null>(
    null,
  );

  const selectedProvider = isProviderId(values.providerId) ? getProvider(values.providerId) : null;
  const providerAvailable = selectedProvider ? isCalculatorAvailable(selectedProvider.id) : false;
  const categoryId = isConsumerCategoryId(values.consumerCategoryId) ? values.consumerCategoryId : null;
  const requirements = categoryId ? getCategoryRequirements(categoryId, selectedProvider?.id) : null;
  const categoryUnsupported =
    selectedProvider !== null &&
    categoryId !== null &&
    getEngine(selectedProvider.id) !== undefined &&
    requirements === null;
  const billingMonthOptions = requirements?.billingMonths ?? [];
  // Effective values fall back to engine defaults the user has not overridden.
  const effectiveBandId = requirements?.bands.some((b) => b.id === values.bandId)
    ? values.bandId
    : (requirements?.defaultBandId ?? "");
  const effectiveBillingMonth = billingMonthOptions.some((m) => m.value === values.billingMonth)
    ? values.billingMonth
    : (billingMonthOptions.at(-1)?.value ?? "");
  const selectedBand = requirements?.bands.find((b) => b.id === effectiveBandId);
  const calculating = phase.kind === "calculating";
  const errorCount = Object.values(errors).filter(Boolean).length;

  function update<K extends keyof CalculatorFormValues>(key: K, value: CalculatorFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // Clear a field's error as soon as the user edits it.
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function focusFirstError(formErrors: CalculatorFormErrors) {
    const first = FIELD_ORDER.find((name) => formErrors[name]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
  }

  async function run(input: CalculationInput, unitsSource: UnitsInputMode) {
    setLastRun({ input, unitsSource });
    setPhase({ kind: "calculating" });
    track({ name: "calculator_started", providerId: input.providerId, categoryId: input.consumerCategoryId });

    let outcome: CalculationOutcome;
    try {
      outcome = await calculateBill(input);
    } catch {
      outcome = { status: "error", message: "Something unexpected happened. Please try again." };
    }
    track({
      name: "calculator_completed",
      providerId: input.providerId,
      categoryId: input.consumerCategoryId,
      outcome: outcome.status,
    });

    if (outcome.status === "invalid") {
      const formErrors = engineErrorsToFormErrors(outcome.errors, unitsSource);
      setErrors(formErrors);
      setPhase({ kind: "idle" });
      focusFirstError(formErrors);
      return;
    }

    setPhase({ kind: "outcome", outcome, input, unitsSource });
    requestAnimationFrame(() => {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (calculating) return;

    const validation = validateCalculatorForm(
      { ...values, bandId: effectiveBandId, billingMonth: effectiveBillingMonth },
      requirements,
    );
    if (!validation.ok) {
      setErrors(validation.errors);
      focusFirstError(validation.errors);
      return;
    }

    setErrors({});
    await run(validation.input, values.inputMode);
  }

  function handleRetry() {
    if (lastRun) void run(lastRun.input, lastRun.unitsSource);
  }

  function setInputMode(mode: UnitsInputMode) {
    setValues((current) => ({ ...current, inputMode: mode }));
    setErrors((current) => ({ ...current, units: undefined, previousReading: undefined, currentReading: undefined }));
  }

  const form = (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-5" aria-describedby={id("form-note")}>
      <Field
        id={id("providerId")}
        label="Electricity provider"
        error={errors.providerId}
      >
        <Select
          id={id("providerId")}
          name="providerId"
          value={values.providerId}
          onChange={(event) => update("providerId", event.target.value)}
          invalid={Boolean(errors.providerId)}
          aria-describedby={describedBy(id("providerId"), false, Boolean(errors.providerId))}
          required
        >
          <option value="" disabled>
            Select your provider
          </option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.shortName === provider.fullName
                ? provider.fullName
                : `${provider.shortName} (${provider.fullName})`}
            </option>
          ))}
        </Select>
      </Field>

      {selectedProvider && !providerAvailable ? (
        <p className="-mt-2 flex items-start gap-2 rounded-lg bg-volt-50 px-3 py-2 text-[0.8125rem] leading-relaxed text-volt-800">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {selectedProvider.shortName} tariff data is still being verified, so estimates are not
            available yet.
          </span>
        </p>
      ) : null}

      <Field id={id("consumerCategoryId")} label="Consumer type" error={errors.consumerCategoryId}>
        <Select
          id={id("consumerCategoryId")}
          name="consumerCategoryId"
          value={values.consumerCategoryId}
          onChange={(event) => update("consumerCategoryId", event.target.value)}
          invalid={Boolean(errors.consumerCategoryId)}
          aria-describedby={describedBy(id("consumerCategoryId"), false, Boolean(errors.consumerCategoryId))}
          required
        >
          {consumerCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </Select>
      </Field>

      {categoryUnsupported && categoryId ? (
        <p className="-mt-2 flex items-start gap-2 rounded-lg bg-volt-50 px-3 py-2 text-[0.8125rem] leading-relaxed text-volt-800">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {getConsumerCategory(categoryId).label} estimates are not available yet. Residential and
            commercial connections below 5 kW are supported.
          </span>
        </p>
      ) : null}

      {requirements && requirements.bands.length > 1 ? (
        <fieldset className="space-y-2" aria-describedby={errors.bandId ? id("bandId-error") : undefined}>
          <legend className="text-sm font-semibold text-ink-900">Consumer status</legend>
          <div className="grid gap-2">
            {requirements.bands.map((band, index) => (
              <label
                key={band.id}
                className={cx(
                  "flex cursor-pointer gap-3 rounded-[var(--radius-control)] border px-3.5 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600",
                  effectiveBandId === band.id
                    ? "border-brand-600 bg-brand-50/60"
                    : "border-line-control hover:border-ink-600",
                )}
              >
                <input
                  type="radio"
                  id={index === 0 ? id("bandId") : undefined}
                  name={id("bandId")}
                  value={band.id}
                  checked={effectiveBandId === band.id}
                  onChange={() => update("bandId", band.id)}
                  className="mt-1 size-4 shrink-0 accent-brand-700"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink-900">{band.label}</span>
                  <span className="block text-[0.8125rem] leading-relaxed text-ink-600">{band.description}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.bandId ? (
            <p id={id("bandId-error")} className="text-sm text-red-700">
              {errors.bandId}
            </p>
          ) : null}
          <p className="text-[0.8125rem] leading-relaxed text-ink-500">
            Your provider decides your status using official criteria. If unsure, check with your provider.
            {selectedBand?.eligibility ? ` NEPRA’s definition: ${selectedBand.eligibility}` : ""}
          </p>
        </fieldset>
      ) : null}

      {requirements?.sanctionedLoad ? (
        <Field
          id={id("sanctionedLoad")}
          label="Sanctioned load"
          error={errors.sanctionedLoad}
          help={`Shown on your bill as “Sanctioned Load”. Fixed charges depend on it. Loads of ${requirements.sanctionedLoad.maxKwExclusive} kW and above are not supported yet.`}
        >
          <Input
            id={id("sanctionedLoad")}
            name="sanctionedLoad"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 2"
            suffix="kW"
            value={values.sanctionedLoad}
            onChange={(event) => update("sanctionedLoad", event.target.value)}
            invalid={Boolean(errors.sanctionedLoad)}
            aria-describedby={describedBy(id("sanctionedLoad"), true, Boolean(errors.sanctionedLoad))}
            required
          />
        </Field>
      ) : null}

      {billingMonthOptions.length > 0 ? (
        <Field
          id={id("billingMonth")}
          label="Bill month"
          error={errors.billingMonth}
          help="The month printed on your bill. Adjustments differ from month to month."
        >
          <Select
            id={id("billingMonth")}
            name="billingMonth"
            value={effectiveBillingMonth}
            onChange={(event) => update("billingMonth", event.target.value)}
            invalid={Boolean(errors.billingMonth)}
            aria-describedby={describedBy(id("billingMonth"), true, Boolean(errors.billingMonth))}
          >
            {billingMonthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink-900">Units consumed</legend>
        <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-ink-100 p-1">
          {(
            [
              { mode: "units", label: "I know my units" },
              { mode: "readings", label: "Use meter readings" },
            ] as const
          ).map((option) => (
            <label
              key={option.mode}
              className={cx(
                "relative flex min-h-10 cursor-pointer items-center justify-center rounded-[0.6rem] px-2 text-center text-[0.8125rem] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600 sm:text-sm",
                values.inputMode === option.mode
                  ? "bg-surface text-ink-950 shadow-[var(--shadow-control)]"
                  : "text-ink-600 hover:text-ink-900",
              )}
            >
              <input
                type="radio"
                name={id("inputMode")}
                value={option.mode}
                checked={values.inputMode === option.mode}
                onChange={() => setInputMode(option.mode)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>

        {values.inputMode === "units" ? (
          <Field
            id={id("units")}
            label="Units (kWh) for the billing month"
            error={errors.units}
            help="Shown as “Units Consumed” on your bill."
          >
            <Input
              id={id("units")}
              name="units"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="e.g. 250"
              suffix="units"
              value={values.units}
              onChange={(event) => update("units", event.target.value)}
              invalid={Boolean(errors.units)}
              aria-describedby={describedBy(id("units"), true, Boolean(errors.units))}
              required
            />
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={id("previousReading")} label="Previous reading" error={errors.previousReading}>
              <Input
                id={id("previousReading")}
                name="previousReading"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 10450"
                value={values.previousReading}
                onChange={(event) => update("previousReading", event.target.value)}
                invalid={Boolean(errors.previousReading)}
                aria-describedby={describedBy(id("previousReading"), false, Boolean(errors.previousReading))}
                required
              />
            </Field>
            <Field id={id("currentReading")} label="Current reading" error={errors.currentReading}>
              <Input
                id={id("currentReading")}
                name="currentReading"
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="e.g. 10700"
                value={values.currentReading}
                onChange={(event) => update("currentReading", event.target.value)}
                invalid={Boolean(errors.currentReading)}
                aria-describedby={describedBy(id("currentReading"), false, Boolean(errors.currentReading))}
                required
              />
            </Field>
            <p className="text-[0.8125rem] leading-relaxed text-ink-500 sm:col-span-2">
              Units are worked out as current reading minus previous reading.
            </p>
          </div>
        )}
      </fieldset>

      <div className="space-y-3 pt-1">
        <Button
          type="submit"
          size="lg"
          fullWidth
          aria-disabled={calculating || undefined}
          className={cx(calculating && "cursor-wait opacity-80")}
        >
          {calculating ? (
            <>
              <Spinner />
              Calculating…
            </>
          ) : (
            "Calculate Bill"
          )}
        </Button>
        <p role="status" className="text-center text-sm text-red-700">
          {errorCount > 0
            ? `Please correct ${errorCount === 1 ? "the highlighted field" : `${errorCount} highlighted fields`}.`
            : ""}
        </p>
        <p id={id("form-note")} className="text-center text-xs leading-relaxed text-ink-500">
          Results are estimates, not official bills. Your inputs stay in your browser.
        </p>
      </div>
    </form>
  );

  const result = (
    <EstimateResult
      phase={phase}
      onRetry={handleRetry}
      headingId={id("result-heading")}
      regionRef={resultRef}
      compactIdle={layout === "stacked"}
    />
  );

  if (layout === "stacked") {
    return (
      <div className="space-y-6">
        {form}
        <div className="border-t border-line pt-6">{result}</div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-raised)] sm:p-7">
        <p className="mb-6 text-base font-semibold text-ink-950">Your details</p>
        {form}
      </div>
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7 lg:sticky lg:top-24">
        {result}
      </div>
    </div>
  );
}
