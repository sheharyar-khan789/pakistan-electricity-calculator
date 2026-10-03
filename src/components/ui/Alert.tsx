import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { AlertCircleIcon, AlertTriangleIcon, CheckIcon, InfoIcon } from "@/components/icons";

export type AlertTone = "info" | "warning" | "error" | "success";

const tones: Record<AlertTone, { box: string; icon: string; Icon: typeof InfoIcon }> = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-950", icon: "text-sky-700", Icon: InfoIcon },
  warning: {
    box: "border-volt-200 bg-volt-50 text-volt-800",
    icon: "text-volt-700",
    Icon: AlertTriangleIcon,
  },
  error: { box: "border-red-200 bg-red-50 text-red-900", icon: "text-red-700", Icon: AlertCircleIcon },
  success: {
    box: "border-brand-200 bg-brand-50 text-brand-900",
    icon: "text-brand-700",
    Icon: CheckIcon,
  },
};

type AlertProps = {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  /**
   * "alert" interrupts screen readers (use for errors after an action),
   * "status" is announced politely, "none" for static page content.
   */
  live?: "alert" | "status" | "none";
  className?: string;
};

export function Alert({ tone = "info", title, children, live = "none", className }: AlertProps) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div
      role={live === "none" ? undefined : live}
      className={cx("flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", box, className)}
    >
      <Icon className={cx("mt-0.5 size-5 shrink-0", icon)} />
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="[&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2">{children}</div> : null}
      </div>
    </div>
  );
}
