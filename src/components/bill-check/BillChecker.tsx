"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { getProvider, isProviderId, providers, type ProviderId } from "@/data/providers";
import { track } from "@/lib/analytics";
import { getBillCheck, prepareBillLookup } from "@/lib/bill-check/registry";
import type { IdentifierType, PreparedLookup } from "@/lib/bill-check/types";
import { cx } from "@/lib/cx";
import { Button, buttonClasses } from "@/components/ui/Button";
import { describedBy, Field, Input, Select } from "@/components/ui/Field";
import { CheckIcon, ExternalLinkIcon, InfoIcon } from "@/components/icons";

type BillCheckerProps = {
  /** Pre-select a provider (provider pages). */
  initialProviderId?: ProviderId;
  /** Hide the provider select when the page is for one provider. */
  lockProvider?: boolean;
};

type CopyState = "idle" | "copied" | "failed";

/**
 * Bill check form. Validates the identifier with the provider's verified
 * rules, then hands off to the official bill page in a new tab. The
 * identifier is held only in component state: never stored, logged, sent to
 * this site's servers or put in a URL.
 */
export function BillChecker({ initialProviderId, lockProvider = false }: BillCheckerProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const providerRef = useRef<HTMLSelectElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [providerId, setProviderId] = useState<string>(initialProviderId ?? "");
  const [chosenType, setChosenType] = useState<IdentifierType | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<{ field: "provider" | "identifier"; message: string } | null>(null);
  const [lookup, setLookup] = useState<PreparedLookup | null>(null);
  const [copy, setCopy] = useState<CopyState>("idle");

  const config = isProviderId(providerId) ? getBillCheck(providerId) : undefined;
  const provider = isProviderId(providerId) ? getProvider(providerId) : null;
  const rules = config?.identifiers ?? [];
  const rule = rules.find((r) => r.type === chosenType) ?? rules[0];

  function reset() {
    setLookup(null);
    setCopy("idle");
  }

  function onProviderChange(next: string) {
    setProviderId(next);
    setChosenType(null);
    setError(null);
    reset();
    if (isProviderId(next)) track({ name: "provider_selected", providerId: next, context: "bill-check" });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isProviderId(providerId)) {
      setError({ field: "provider", message: "Please select your electricity provider." });
      providerRef.current?.focus();
      track({ name: "bill_check_failed", providerId: "none", reason: "unknown-provider" });
      return;
    }
    const type = rule?.type ?? "reference-number";
    track({ name: "bill_check_started", providerId, identifierType: type });
    const result = prepareBillLookup(providerId, type, value);
    if (!result.ok) {
      setError({ field: result.code === "provider-unavailable" ? "provider" : "identifier", message: result.message });
      setLookup(null);
      (result.code === "provider-unavailable" ? providerRef : inputRef).current?.focus();
      track({ name: "bill_check_failed", providerId, reason: result.code });
      return;
    }
    setError(null);
    setLookup(result.lookup);
    setCopy("idle");
    requestAnimationFrame(() => panelRef.current?.focus());
  }

  async function copyNumber(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  function onOpenOfficial() {
    if (!lookup || !isProviderId(providerId)) return;
    // Best effort: copy so the user can paste on the official page.
    void copyNumber(lookup.copyValue);
    track({ name: "bill_check_redirected", providerId, identifierType: lookup.identifier.type });
  }

  const identifierError = error?.field === "identifier" ? error.message : undefined;
  const providerError = error?.field === "provider" ? error.message : undefined;

  return (
    <div className="space-y-5">
      <form noValidate onSubmit={onSubmit} className="space-y-4" aria-describedby={id("privacy-note")}>
        {lockProvider && provider ? (
          <p className="text-sm text-ink-600">
            Provider: <strong className="font-semibold text-ink-900">{provider.shortName === provider.fullName ? provider.fullName : `${provider.shortName} (${provider.fullName})`}</strong>
          </p>
        ) : (
          <Field id={id("provider")} label="Electricity provider" error={providerError}>
            <Select
              ref={providerRef}
              id={id("provider")}
              value={providerId}
              onChange={(e) => onProviderChange(e.target.value)}
              invalid={Boolean(providerError)}
              aria-describedby={describedBy(id("provider"), false, Boolean(providerError))}
            >
              <option value="" disabled>
                Select your provider
              </option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName === p.fullName ? p.fullName : `${p.shortName} (${p.fullName})`}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {rules.length > 1 ? (
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-ink-900">Search by</legend>
            <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-ink-100 p-1">
              {rules.map((r) => (
                <label
                  key={r.type}
                  className={cx(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-[0.6rem] px-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600",
                    rule?.type === r.type ? "bg-surface text-ink-950 shadow-[var(--shadow-control)]" : "text-ink-600 hover:text-ink-900",
                  )}
                >
                  <input
                    type="radio"
                    name={id("type")}
                    value={r.type}
                    checked={rule?.type === r.type}
                    onChange={() => {
                      setChosenType(r.type);
                      setError(null);
                      reset();
                    }}
                    className="sr-only"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <Field
          id={id("identifier")}
          label={rule ? rule.label : "Reference Number"}
          error={identifierError}
          help={
            rule
              ? `${rule.digits} digits${rule.suffixes ? `, optionally followed by ${rule.suffixes.join(" or ")}` : ""}. Spaces and dashes are fine.`
              : "Select your provider first."
          }
        >
          <Input
            ref={inputRef}
            id={id("identifier")}
            name="identifier"
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error?.field === "identifier") setError(null);
              if (lookup) reset();
            }}
            invalid={Boolean(identifierError)}
            aria-describedby={describedBy(id("identifier"), true, Boolean(identifierError))}
          />
        </Field>

        <Button type="submit" size="lg" fullWidth>
          Check Bill
        </Button>
        <p id={id("privacy-note")} className="text-center text-xs leading-relaxed text-ink-500">
          Your number stays in your browser. You will view your bill on the provider’s official page.
        </p>
      </form>

      {lookup && provider ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-labelledby={id("ready-heading")}
          className="space-y-4 rounded-[var(--radius-card)] border border-brand-200 bg-brand-50/50 p-4 focus:outline-none sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
              <CheckIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 id={id("ready-heading")} className="text-base font-semibold text-ink-950">
                {rule?.label} looks valid
              </h3>
              <p className="mt-0.5 break-all font-mono text-sm text-ink-700">
                {lookup.identifier.digits}
                {lookup.identifier.suffix ? ` ${lookup.identifier.suffix}` : ""}
              </p>
            </div>
          </div>

          <a
            href={lookup.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpenOfficial}
            className={buttonClasses({ size: "lg", fullWidth: true, wrap: true })}
          >
            Open official {provider.shortName} bill page
            <ExternalLinkIcon className="size-4" />
            <span className="sr-only">(opens {lookup.destinationHost} in a new tab)</span>
          </a>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-ink-600">
              Opens <strong className="font-semibold text-ink-800">{lookup.destinationHost}</strong>, run by {lookup.operator}
            </span>
            <button
              type="button"
              onClick={() => void copyNumber(lookup.copyValue)}
              className="rounded-lg px-2 py-1 font-semibold text-brand-700 hover:bg-brand-100"
            >
              Copy number
            </button>
          </div>
          <p role="status" className="text-sm text-ink-600">
            {copy === "copied"
              ? "Number copied. Paste it on the official page."
              : copy === "failed"
                ? "Couldn’t copy automatically. Type the number shown above on the official page."
                : ""}
          </p>

          <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-ink-700">
            {lookup.steps.slice(1).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="flex gap-2 text-xs leading-relaxed text-ink-500">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              This website does not receive or store your bill. If the official page does not open or shows an
              error, the service may be temporarily unavailable — please try again later.
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
