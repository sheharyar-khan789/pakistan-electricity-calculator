"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { primaryNav, routes } from "@/config/routes";
import { cx } from "@/lib/cx";
import { buttonClasses } from "@/components/ui/Button";
import { CloseIcon, MenuIcon } from "@/components/icons";

function isActive(pathname: string, href: string): boolean {
  if (href === routes.home) return pathname === routes.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Primary navigation. Links are plain anchors in the server HTML (crawlable);
 * JavaScript only adds the active state and the mobile menu toggle.
 */
export function HeaderNav() {
  const pathname = usePathname();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close the mobile menu after navigating.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <nav aria-label="Main" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                    active ? "text-ink-950" : "text-ink-600 hover:bg-ink-50 hover:text-ink-950",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <Link href={routes.billCheck} className={buttonClasses({ size: "sm" })}>
            Check Bill
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl text-ink-900 hover:bg-ink-50 lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      <div
        id={menuId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-[var(--shadow-raised)] lg:hidden"
      >
        <nav aria-label="Main mobile" className="mx-auto max-w-6xl px-4 pb-5 pt-2 sm:px-6">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex min-h-12 items-center rounded-lg px-3 text-base font-medium",
                      active ? "bg-brand-50 text-brand-800" : "text-ink-800 hover:bg-ink-50",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={routes.billCheck}
            className={buttonClasses({ size: "lg", fullWidth: true, className: "mt-3" })}
          >
            Check Electricity Bill
          </Link>
        </nav>
      </div>
    </>
  );
}
