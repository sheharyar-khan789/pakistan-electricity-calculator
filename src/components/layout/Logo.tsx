import Link from "next/link";
import { siteConfig } from "@/config/site";
import { routes } from "@/config/routes";
import { cx } from "@/lib/cx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="9" fill="#0a1626" />
      <path d="M17.6 5.5 9.5 17.6h6.1l-1.2 8.9 8.1-12.1h-6.1l1.2-8.9Z" fill="#fbbf24" />
    </svg>
  );
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href={routes.home}
      className="group flex shrink-0 items-center gap-2.5 rounded-lg"
      aria-label={`${siteConfig.name} — home`}
    >
      <LogoMark className={cx("size-9 shrink-0", inverse && "ring-1 ring-white/15 rounded-[9px]")} />
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            "text-[0.9375rem] font-semibold tracking-tight",
            inverse ? "text-white" : "text-ink-950",
          )}
        >
          Pakistan Electricity
        </span>
        <span className={cx("mt-1 text-xs font-medium", inverse ? "text-ink-300" : "text-ink-500")}>
          &amp; Utility Calculator
        </span>
      </span>
    </Link>
  );
}
