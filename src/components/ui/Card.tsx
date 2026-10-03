import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside";
  padding?: "none" | "md" | "lg";
  elevated?: boolean;
  children: ReactNode;
};

const paddings = {
  none: "",
  md: "p-5 sm:p-6",
  lg: "p-5 sm:p-8",
};

export function Card({
  as: Tag = "div",
  padding = "md",
  elevated = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-surface",
        elevated ? "shadow-[var(--shadow-raised)]" : "shadow-[var(--shadow-card)]",
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
