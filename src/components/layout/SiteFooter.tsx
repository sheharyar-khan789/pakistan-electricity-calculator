import Link from "next/link";
import { footerNav, routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Layout";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink-950 text-ink-300">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo inverse />
            <p className="mt-4 text-sm leading-relaxed">
              An independent website for estimating electricity costs in Pakistan. Not affiliated
              with NEPRA, any electricity distribution company or any government body.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerNav.map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <p className="text-sm font-semibold text-white">{group.heading}</p>
                <ul className="mt-3 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-9 items-center text-sm transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-ink-400">
          <p>
            Results on this website are estimates for guidance only and are not official electricity
            bills. Always refer to the bill issued by your electricity provider. See the{" "}
            <Link href={routes.disclaimer} className="underline underline-offset-2 hover:text-white">
              disclaimer
            </Link>
            .
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </Container>
    </footer>
  );
}
