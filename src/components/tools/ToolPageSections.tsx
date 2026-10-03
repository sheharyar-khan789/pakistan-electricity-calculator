import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import { tools, type Tool, type ToolId } from "@/data/tools";
import { faqPageSchema, type FaqEntry } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { Card } from "@/components/ui/Card";
import { FaqList } from "@/components/ui/FaqList";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowRightIcon, CalculatorIcon, ClockIcon, GaugeIcon, PlugIcon, ReceiptIcon, SnowflakeIcon } from "@/components/icons";
import { ToolLink } from "./ToolLink";
import { formatDate } from "@/lib/format";
import type { RateOptions } from "@/lib/energy/tariff-rates";

/**
 * Server-rendered sections shared by every electricity tool page:
 * explanation cards, formula, FAQ (with matching FAQPage data), related
 * tools, the bill-check link and the disclaimer.
 */

export function ToolCard({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card as="section" aria-labelledby={id} padding="lg" className="min-w-0">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-ink-950">
        {title}
      </h2>
      <div className="prose-content mt-4">{children}</div>
    </Card>
  );
}

/** A formula shown as readable text, not an image, so it can be copied and read aloud. */
export function Formula({ lines }: { lines: readonly string[] }) {
  return (
    <div className="my-4 rounded-xl bg-ink-950 px-4 py-3.5 font-mono text-[0.8125rem] leading-relaxed text-ink-100 sm:text-sm">
      {lines.map((line) => (
        <p key={line} className="whitespace-pre-wrap">
          {line}
        </p>
      ))}
    </div>
  );
}

export function ToolFaq({ items, headingId = "faq-heading" }: { items: readonly FaqEntry[]; headingId?: string }) {
  return (
    <section aria-labelledby={headingId}>
      <JsonLd data={faqPageSchema(items)} />
      <h2 id={headingId} className="text-2xl font-semibold tracking-tight text-ink-950">
        Frequently asked questions
      </h2>
      <div className="mt-5">
        <FaqList items={items} />
      </div>
    </section>
  );
}

const ICONS: Record<Tool["icon"], typeof CalculatorIcon> = {
  calculator: CalculatorIcon,
  clock: ClockIcon,
  gauge: GaugeIcon,
  plug: PlugIcon,
  snowflake: SnowflakeIcon,
};

/** Grid of tool cards. Used on the homepage, /calculators and as "related tools". */
export function ToolGrid({
  exclude,
  from,
  headingLevel = "h3",
}: {
  exclude?: ToolId;
  from: "home" | "calculators" | "related-tools";
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {tools
        .filter((t) => t.id !== exclude)
        .map((tool) => {
          const Icon = ICONS[tool.icon];
          return (
            <li key={tool.id}>
              <ToolLink
                tool={tool.id}
                href={tool.href}
                from={from}
                className="group flex h-full gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[var(--shadow-raised)]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700">
                  <Icon />
                </span>
                <span className="min-w-0">
                  <Heading className="text-base font-semibold text-ink-950 group-hover:text-brand-800">{tool.title}</Heading>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-600">{tool.summary}</span>
                </span>
              </ToolLink>
            </li>
          );
        })}
    </ul>
  );
}

export function RelatedTools({ current }: { current: ToolId }) {
  return (
    <section aria-labelledby="related-tools-heading">
      <h2 id="related-tools-heading" className="text-2xl font-semibold tracking-tight text-ink-950">
        Related electricity tools
      </h2>
      <div className="mt-5">
        <ToolGrid exclude={current} from="related-tools" />
      </div>
    </section>
  );
}

/** Points to the primary product: the official bill. */
export function BillCheckCta() {
  return (
    <section
      aria-labelledby="bill-check-cta-heading"
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-xl text-white">
          <ReceiptIcon />
        </span>
        <div>
          <h2 id="bill-check-cta-heading" className="text-lg font-semibold text-ink-950">
            Need your actual bill?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            Your official bill shows the units you were billed and the amount to pay. Check it online with your
            reference number or customer ID.
          </p>
        </div>
      </div>
      <Link href={routes.billCheck} className={buttonClasses({ variant: "primary", wrap: true, className: "shrink-0" })}>
        Check your bill
        <ArrowRightIcon className="size-4" />
      </Link>
    </section>
  );
}

export function ToolDisclaimer({ children }: { children?: ReactNode }) {
  return (
    <aside aria-label="Disclaimer" className="rounded-xl border border-line bg-ink-50/70 p-4 text-sm leading-relaxed text-ink-600 sm:p-5">
      <p>
        {children ?? "Results are estimates for planning only and are not an official bill."} Your provider’s bill is
        always the amount to pay. This website is independent and not affiliated with NEPRA, any electricity company or
        the Government of Pakistan. See the <Link href={routes.methodology} className="font-semibold text-brand-700 underline underline-offset-2">methodology</Link> and{" "}
        <Link href={routes.disclaimer} className="font-semibold text-brand-700 underline underline-offset-2">disclaimer</Link>.
      </p>
    </aside>
  );
}

/**
 * Method and sources for tools that offer official tariff rates. The tariff
 * version, effective date and references come from the verified data.
 */
export function RateSourceCard({ rateOptions }: { rateOptions: RateOptions | null }) {
  return (
    <ToolCard id="source-heading" title="Method and sources">
      <p>
        Energy is power multiplied by time: watts × hours ÷ 1,000 gives kilowatt-hours, and one kilowatt-hour is one unit
        on your bill. The cost is units multiplied by the rate per unit you enter.
      </p>
      {rateOptions ? (
        <p>
          The optional official rates are the slab energy rates of the tariff version in force from{" "}
          {formatDate(rateOptions.effectiveFrom)} (“{rateOptions.scheduleTitle}”)
          {rateOptions.adjustmentsText ? `, plus the ${rateOptions.adjustmentsText}` : ""} for {rateOptions.billingMonthLabel} bills.
          {rateOptions.pendingText ? ` The ${rateOptions.pendingText} for that month has not been notified yet, so it is not included.` : ""} Sources: {rateOptions.references.join(", ")}. See every
          document on the <Link href={routes.sources}>sources page</Link>.
        </p>
      ) : (
        <p>Official tariff rates are not available to pick right now, so enter your own rate per unit.</p>
      )}
      <p>
        Read the full <Link href={routes.methodology}>methodology</Link> for how tariff data is verified.
      </p>
    </ToolCard>
  );
}
