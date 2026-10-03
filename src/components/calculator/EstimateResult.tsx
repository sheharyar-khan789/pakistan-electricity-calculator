import Link from "next/link";
import type { Ref } from "react";
import { routes } from "@/config/routes";
import type { CalculationInput, CalculationOutcome } from "@/lib/calculator/types";
import type { UnitsInputMode } from "@/lib/calculator/validation";
import { formatUnits } from "@/lib/format";
import { cx } from "@/lib/cx";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { RefreshIcon } from "@/components/icons";
import { ResultBreakdown } from "./ResultBreakdown";

export type DisplayOutcome = Exclude<CalculationOutcome, { status: "invalid" }>;

export type CalculatorPhase =
  | { kind: "idle" }
  | { kind: "calculating" }
  | {
      kind: "outcome";
      outcome: DisplayOutcome;
      input: CalculationInput;
      /** How the units were entered; readings-derived units are echoed back. */
      unitsSource: UnitsInputMode;
    };

/** Placeholder rows shown before a real result exists. Never filled with fake values. */
function NotCalculated() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not calculated</span>
    </>
  );
}

const PLACEHOLDER_ROWS = ["Electricity charges", "Taxes", "Adjustments"] as const;

function PlaceholderBreakdown({ muted }: { muted?: boolean }) {
  return (
    <div className={cx(muted && "opacity-70")}>
      <p className="text-sm font-medium text-ink-600">Estimated electricity bill</p>
      <p className="mt-1 text-4xl font-semibold tracking-tight text-ink-300 sm:text-5xl">
        Rs. <NotCalculated />
      </p>
      <dl className="mt-5 divide-y divide-line rounded-xl border border-line">
        {PLACEHOLDER_ROWS.map((label) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-ink-600">{label}</dt>
            <dd className="text-sm font-medium text-ink-400">
              <NotCalculated />
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 bg-ink-50 px-4 py-3">
          <dt className="text-sm font-semibold text-ink-900">Estimated total</dt>
          <dd className="text-sm font-semibold text-ink-400">
              <NotCalculated />
            </dd>
        </div>
      </dl>
    </div>
  );
}

function UnitsFromReadings({ units }: { units: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5">
      <p className="text-sm font-medium text-brand-900">Units consumed (from meter readings)</p>
      <p className="text-lg font-semibold text-brand-900 tabular-nums">{formatUnits(units)}</p>
    </div>
  );
}

type EstimateResultProps = {
  phase: CalculatorPhase;
  onRetry: () => void;
  headingId: string;
  /** The region receives focus after a calculation so the outcome is announced. */
  regionRef?: Ref<HTMLDivElement>;
  /** Show a one-line placeholder before the first calculation (embedded use). */
  compactIdle?: boolean;
  className?: string;
};

export function EstimateResult({
  phase,
  onRetry,
  headingId,
  regionRef,
  compactIdle = false,
  className,
}: EstimateResultProps) {
  const busy = phase.kind === "calculating";

  return (
    <div
      ref={regionRef}
      tabIndex={-1}
      role="region"
      aria-labelledby={headingId}
      aria-busy={busy || undefined}
      className={cx("focus:outline-none", className)}
    >
      <h2 id={headingId} className="sr-only">
        Your estimate
      </h2>

      {phase.kind === "idle" && compactIdle ? (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-ink-50 px-4 py-3.5">
          <p className="text-sm font-medium text-ink-600">Estimated electricity bill</p>
          <p className="text-lg font-semibold text-ink-400">
            Rs. <NotCalculated />
          </p>
        </div>
      ) : null}

      {phase.kind === "idle" && !compactIdle ? (
        <div className="space-y-4">
          <PlaceholderBreakdown />
          <p className="text-sm leading-relaxed text-ink-500">
            Select your provider, enter your units and choose <strong className="font-semibold text-ink-700">Calculate Bill</strong> to see an estimated breakdown.
          </p>
        </div>
      ) : null}

      {phase.kind === "calculating" ? (
        <div className="space-y-4">
          <PlaceholderBreakdown muted />
          <LoadingState label="Calculating your estimate…" />
        </div>
      ) : null}

      {phase.kind === "outcome" && phase.outcome.status === "success" ? (
        <ResultBreakdown result={phase.outcome.result} />
      ) : null}

      {phase.kind === "outcome" && phase.outcome.status === "unavailable" ? (
        <div className="space-y-4">
          {phase.unitsSource === "readings" ? (
            <UnitsFromReadings units={phase.input.unitsConsumed} />
          ) : null}
          <Alert tone="warning" title="Estimate not available yet" live="status">
            <p>{phase.outcome.message}</p>
            {phase.outcome.reason === "load-not-supported" ? (
              <p className="mt-2">
                <Link href={routes.touCalculator}>Open the TOU bill calculator</Link>
              </p>
            ) : null}
            <p className="mt-2">
              We only show figures calculated from verified tariff sources. Read how calculations will
              work in our <Link href={routes.methodology}>methodology</Link>.
            </p>
          </Alert>
          <PlaceholderBreakdown muted />
        </div>
      ) : null}

      {phase.kind === "outcome" && phase.outcome.status === "error" ? (
        <ErrorState
          title="We couldn’t calculate this estimate"
          description={phase.outcome.message}
          action={
            <Button variant="secondary" onClick={onRetry}>
              <RefreshIcon className="size-4" />
              Try again
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
