import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { AlertCircleIcon, ChevronDownIcon } from "@/components/icons";

/**
 * Form field primitives. `Field` wires label, help text and error message
 * to the control through ids so screen readers announce all three.
 */

export function fieldIds(id: string) {
  return { help: `${id}-help`, error: `${id}-error` };
}

export function describedBy(id: string, hasHelp: boolean, hasError: boolean): string | undefined {
  const ids = fieldIds(id);
  const parts = [hasError && ids.error, hasHelp && ids.help].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

type FieldProps = {
  id: string;
  label: string;
  help?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ id, label, help, error, optional, className, children }: FieldProps) {
  const ids = fieldIds(id);
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-900">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-500">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={ids.error} className="flex items-start gap-1.5 text-sm text-red-700">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      {help ? (
        <p id={ids.help} className="text-[0.8125rem] leading-relaxed text-ink-500">
          {help}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  "block w-full min-w-0 rounded-[var(--radius-control)] border bg-surface text-base text-ink-900 shadow-[var(--shadow-control)] transition-[border-color,box-shadow] duration-150 placeholder:text-ink-500 focus:outline-none focus-visible:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500";

const controlState = (invalid: boolean) =>
  invalid
    ? "border-red-500 focus:border-red-600 focus:ring-red-200"
    : "border-line-control hover:border-ink-600 focus:border-brand-600 focus:ring-brand-200";

type InputProps = ComponentProps<"input"> & {
  invalid?: boolean;
  /** Text shown inside the right edge of the control, e.g. "kWh". */
  suffix?: string;
};

export function Input({ invalid = false, suffix, className, ...props }: InputProps) {
  return (
    <div className="relative">
      <input
        aria-invalid={invalid || undefined}
        className={cx(controlBase, controlState(invalid), "h-12 px-3.5", suffix && "pr-16", className)}
        {...props}
      />
      {suffix ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-ink-500"
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

type SelectProps = ComponentProps<"select"> & { invalid?: boolean };

export function Select({ invalid = false, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cx(
          controlBase,
          controlState(invalid),
          "h-12 cursor-pointer appearance-none pl-3.5 pr-10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-500"
      />
    </div>
  );
}
