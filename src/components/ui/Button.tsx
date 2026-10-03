import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "inverse"
  | "inverse-outline";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-700 text-white shadow-[var(--shadow-control)] hover:bg-brand-800 active:bg-brand-900",
  // Primary action on dark backgrounds.
  accent: "bg-brand-400 text-ink-950 hover:bg-brand-300 active:bg-brand-500",
  secondary:
    "border border-line-strong bg-surface text-ink-900 shadow-[var(--shadow-control)] hover:border-ink-400 hover:bg-ink-50",
  ghost: "text-brand-700 hover:bg-brand-50 hover:text-brand-800",
  inverse: "bg-white text-ink-950 hover:bg-ink-100",
  "inverse-outline":
    "border border-white/25 text-white hover:border-white/50 hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-[0.9375rem]",
  md: "h-11 px-4 text-[0.9375rem]",
  lg: "h-12 px-5 text-base sm:h-13 sm:px-6",
};

/** Same sizes with a minimum height, for labels that may wrap on small screens. */
const wrappingSizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-[0.9375rem]",
  md: "min-h-11 px-4 py-2.5 text-[0.9375rem]",
  lg: "min-h-12 px-5 py-3 text-base sm:min-h-13 sm:px-6",
};

export function buttonClasses(options: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Allow long labels to wrap instead of overflowing narrow screens. */
  wrap?: boolean;
  className?: string;
}): string {
  const { variant = "primary", size = "md", fullWidth = false, wrap = false, className } = options;
  return cx(
    base,
    wrap ? "whitespace-normal text-center" : "whitespace-nowrap",
    variants[variant],
    wrap ? wrappingSizes[size] : sizes[size],
    fullWidth && "w-full",
    className,
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props} />;
}
