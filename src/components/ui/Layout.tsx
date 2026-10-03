import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

type SectionProps = {
  id?: string;
  /** id of the heading that names this section (for aria-labelledby). */
  labelledBy?: string;
  tone?: "canvas" | "surface" | "dark";
  className?: string;
  children: ReactNode;
};

const sectionTones = {
  canvas: "bg-canvas",
  surface: "bg-surface border-y border-line",
  dark: "bg-ink-950 text-white",
};

export function Section({ id, labelledBy, tone = "canvas", className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx("py-14 sm:py-20", sectionTones[tone], className)}
    >
      <Container>{children}</Container>
    </section>
  );
}

type SectionHeadingProps = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h2" | "h3";
  inverse?: boolean;
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  inverse = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cx("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p
          className={cx(
            "mb-3 text-xs font-semibold uppercase tracking-[0.14em]",
            inverse ? "text-brand-300" : "text-brand-700",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        id={id}
        className={cx(
          "text-balance text-2xl font-semibold tracking-tight sm:text-3xl",
          inverse ? "text-white" : "text-ink-950",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cx(
            "mt-3 text-pretty text-base leading-relaxed sm:text-lg",
            inverse ? "text-ink-300" : "text-ink-600",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
