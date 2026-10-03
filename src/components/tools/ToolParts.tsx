import type { ReactNode, Ref } from "react";
import { cx } from "@/lib/cx";
import { Field, Input, describedBy } from "@/components/ui/Field";

/**
 * Building blocks shared by the unit, appliance and AC calculators:
 * a numeric field, the result region and result rows.
 */

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: ReactNode;
  suffix?: string;
  optional?: boolean;
  placeholder?: string;
  /** Whole numbers only: shows the numeric keypad without a decimal point. */
  integer?: boolean;
  className?: string;
};

export function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  help,
  suffix,
  optional,
  placeholder,
  integer = false,
  className,
}: NumberFieldProps) {
  return (
    <Field id={id} label={label} help={help} error={error} optional={optional} className={className}>
      <Input
        id={id}
        name={id}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        suffix={suffix}
        invalid={Boolean(error)}
        aria-describedby={describedBy(id, Boolean(help), Boolean(error))}
        required={!optional}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

type ResultPanelProps = {
  headingId: string;
  title: string;
  regionRef?: Ref<HTMLDivElement>;
  /** Shown before the first calculation. */
  idle: ReactNode;
  /** Present once a calculation succeeded. */
  children?: ReactNode;
  className?: string;
};

/**
 * Result region. It receives focus after a calculation, so screen readers
 * read the heading and figures (same pattern as the bill calculator).
 */
export function ResultPanel({ headingId, title, regionRef, idle, children, className }: ResultPanelProps) {
  return (
    <div
      ref={regionRef}
      tabIndex={-1}
      role="region"
      aria-labelledby={headingId}
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:p-6",
        className,
      )}
    >
      <h2 id={headingId} className="text-lg font-semibold tracking-tight text-ink-950">
        {title}
      </h2>
      <div className="mt-4">{children ?? <div className="text-sm leading-relaxed text-ink-500">{idle}</div>}</div>
    </div>
  );
}

/** The main figure of a result, e.g. "Estimated monthly cost". */
export function ResultHeadline({ label, value, note }: { label: string; value: string; note?: ReactNode }) {
  return (
    <div className="rounded-xl bg-ink-950 px-4 py-4 text-white sm:px-5">
      <p className="text-sm font-medium text-ink-300">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {note ? <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-300">{note}</p> : null}
    </div>
  );
}

/** Label/value rows for the breakdown under the headline. */
export function ResultRows({ rows }: { rows: readonly { label: ReactNode; value: string; key: string }[] }) {
  return (
    <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
      {rows.map((row) => (
        <div key={row.key} className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
          <dt className="min-w-0 text-ink-600">{row.label}</dt>
          <dd className="shrink-0 text-right font-semibold tabular-nums text-ink-950">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Small reminder printed under every result. */
export function ResultFootnote({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-500">{children}</p>;
}
