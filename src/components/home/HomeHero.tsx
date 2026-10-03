import Link from "next/link";
import { routes } from "@/config/routes";
import { BillChecker } from "@/components/bill-check/BillChecker";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { ArrowRightIcon, BoltIcon, CheckIcon } from "@/components/icons";

/** Statements that are true about the product today. */
const HERO_POINTS = ["Opens your provider’s own bill page", "Your number stays in your browser", "Free, no sign-up"] as const;

export function HomeHero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-ink-950 text-white">
      <div aria-hidden="true" className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]" />
      <div aria-hidden="true" className="absolute -right-40 -top-40 size-[36rem] rounded-full bg-brand-500/15 blur-3xl" />
      <Container className="relative grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:py-20">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-ink-200">
            <BoltIcon className="size-3.5 text-volt-400" />
            LESCO · IESCO · MEPCO · K-Electric and more
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-balance text-[2.125rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]"
          >
            Check Your Electricity Bill Online
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-ink-300 sm:text-lg">
            Select your electricity provider and enter your Reference Number or Customer ID. We check its format and take
            you to your provider’s official bill page, where your bill is shown.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5 text-sm text-ink-300 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {HERO_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-brand-400" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8 hidden lg:block">
            <ButtonLink href={routes.electricityBillCalculator} variant="inverse-outline" size="lg">
              Calculate Bill
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>
        </div>

        <div id="bill-check">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-1.5 shadow-2xl shadow-black/30">
            <div className="rounded-[var(--radius-card)] bg-surface p-5 text-ink-900 sm:p-6">
              <p className="mb-5 text-base font-semibold text-ink-950">Check your bill</p>
              <BillChecker />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-ink-300 lg:hidden">
            Want an estimate instead?{" "}
            <Link href={routes.electricityBillCalculator} className="font-semibold text-white underline underline-offset-2">
              Calculate Bill
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
