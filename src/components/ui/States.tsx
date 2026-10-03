import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { AlertCircleIcon } from "@/components/icons";

/** Neutral placeholder for "nothing here yet" content. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-ink-100 text-2xl text-ink-600">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold text-ink-900">{title}</p>
      {description ? (
        <div className="mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-ink-600">{description}</div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}

/** Use inside a region that has aria-busy; the label is read to screen readers. */
export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cx("flex items-center gap-3 text-sm text-ink-600", className)}>
      <Spinner className="text-brand-600" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cx(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-red-200 bg-red-50/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-red-100 text-2xl text-red-700">
        <AlertCircleIcon />
      </div>
      <p className="text-base font-semibold text-red-950">{title}</p>
      {description ? (
        <div className="mt-1.5 max-w-md text-sm leading-relaxed text-red-900/80">{description}</div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
