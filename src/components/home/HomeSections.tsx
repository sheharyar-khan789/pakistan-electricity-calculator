import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import { mainCalculatorStatus } from "@/data/calculators";
import { getBillCheckHubFaq } from "@/data/bill-check-faq";
import { homeFaq } from "@/data/faq";
import { BillCheckProviderGrid } from "@/components/bill-check/BillCheckSections";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { FaqList } from "@/components/ui/FaqList";
import { Section, SectionHeading } from "@/components/ui/Layout";
import { ToolGrid } from "@/components/tools/ToolPageSections";
import {
  ArrowRightIcon,
  BuildingIcon,
  CalculatorIcon,
  DocumentIcon,
  GaugeIcon,
  LayersIcon,
  PlugIcon,
  ReceiptIcon,
  RefreshIcon,
  ShieldIcon,
} from "@/components/icons";

/* ------------------------------------------------------------------ */

export function ProvidersSection() {
  return (
    <Section labelledBy="providers-heading">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading
          id="providers-heading"
          eyebrow="Supported providers"
          title="Check your bill by provider"
          description="Each provider page shows which numbers its official bill page accepts and links straight to it."
        />
        <Link
          href={routes.billCheck}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          All bill checks
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
      <BillCheckProviderGrid className="mt-8" />
    </Section>
  );
}

/* ------------------------------------------------------------------ */

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
  /** "engine" = depends on a connected calculation engine; resolved at render. */
  status: "engine" | "available" | "planned";
};

const FEATURES: readonly Feature[] = [
  {
    title: "Electricity bill check",
    description: "Open your provider’s official bill page with your reference number, Customer ID or KE account number.",
    icon: <ReceiptIcon />,
    status: "available",
  },
  {
    title: "Electricity bill estimation",
    description: "Estimate a monthly bill from your provider, consumer type and units consumed.",
    icon: <CalculatorIcon />,
    status: "engine",
  },
  {
    title: "Unit calculation",
    description: "Work out units consumed from your previous and current meter readings.",
    icon: <GaugeIcon />,
    status: "available",
  },
  {
    title: "Tariff & slab information",
    description: "See which tariff and unit slabs apply, with the source and effective date.",
    icon: <LayersIcon />,
    status: "engine",
  },
  {
    title: "Provider-specific calculators",
    description: "Estimates with charges and adjustments line by line for LESCO, IESCO, MEPCO, K-Electric and more.",
    icon: <BuildingIcon />,
    status: "engine",
  },
  {
    title: "Utility tools",
    description: "Further household utility calculators, added only where reliable data exists.",
    icon: <PlugIcon />,
    status: "planned",
  },
];

type ResolvedStatus = "available" | "in-development" | "planned";

const FEATURE_STATUS: Record<ResolvedStatus, { label: string; tone: "brand" | "warning" | "neutral" }> = {
  available: { label: "Available", tone: "brand" },
  "in-development": { label: "In development", tone: "warning" },
  planned: { label: "Planned", tone: "neutral" },
};

export function FeaturesSection() {
  return (
    <Section labelledBy="features-heading" tone="surface">
      <SectionHeading
        id="features-heading"
        eyebrow="Electricity tools"
        title="Everything around your electricity bill"
        description="Each feature is labelled with its current status, so you always know what is ready to use."
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const resolved: ResolvedStatus =
            feature.status === "engine" ? mainCalculatorStatus() : feature.status;
          const status = FEATURE_STATUS[resolved];
          return (
            <li key={feature.title} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-canvas p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-ink-950 text-xl text-volt-400">
                  {feature.icon}
                </span>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-950">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{feature.description}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    title: "Select your provider",
    description: "Pick the company named on your electricity bill, such as LESCO, IESCO or K-Electric.",
  },
  {
    title: "Enter your number",
    description: "Type your reference number, Customer ID or K-Electric account number. We check the format.",
  },
  {
    title: "View your official bill",
    description: "We copy your number and open your provider’s official bill page, where you see your current bill.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <Section labelledBy="how-heading">
      <SectionHeading
        id="how-heading"
        eyebrow="How it works"
        title="Check your bill in three steps"
        align="center"
        className="mx-auto"
      />
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800 ring-1 ring-brand-200"
            >
              {index + 1}
            </span>
            <h3 className="mt-4 text-base font-semibold text-ink-950">
              <span className="sr-only">Step {index + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const PRINCIPLES = [
  {
    title: "Official sources only",
    description: "Tariff figures come from documents published by NEPRA and the Government of Pakistan.",
    icon: <ShieldIcon />,
  },
  {
    title: "Versioned and dated",
    description: "Each estimate shows the tariff version, its effective date and when it was last verified.",
    icon: <RefreshIcon />,
  },
  {
    title: "Open about limits",
    description: "Estimates say what they include and leave out, such as arrears or late payment surcharges.",
    icon: <DocumentIcon />,
  },
] as const;

export function MethodologySection() {
  return (
    <Section labelledBy="methodology-heading" tone="dark">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div>
          <SectionHeading
            id="methodology-heading"
            eyebrow="Methodology"
            title="Estimates you can trace back to the source"
            description="Bill checks open official provider pages, and calculator estimates use tariff notifications from NEPRA and the Government of Pakistan. Every source is listed."
            inverse
          />
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
            <ButtonLink href={routes.methodology} variant="inverse" size="md">
              Read the methodology
            </ButtonLink>
            <ButtonLink href={routes.sources} variant="inverse-outline" size="md">
              View sources
            </ButtonLink>
          </div>
        </div>
        <ul className="grid gap-3">
          {PRINCIPLES.map((principle) => (
            <li key={principle.title} className="flex gap-4 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl text-brand-300">
                {principle.icon}
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">{principle.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-300">{principle.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function FaqSection() {
  return (
    <Section labelledBy="faq-heading">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQ"
          title="Frequently asked questions"
          description={
            <>
              Can’t find an answer? Read the <Link href={routes.methodology} className="font-medium text-brand-700 underline underline-offset-2">methodology</Link> or the <Link href={routes.disclaimer} className="font-medium text-brand-700 underline underline-offset-2">disclaimer</Link>.
            </>
          }
        />
        <FaqList items={homePageFaq()} />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function FinalCtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="pb-16 sm:pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-brand-800 px-6 py-10 text-center sm:px-12 sm:py-14">
          <div aria-hidden="true" className="bg-grid-dark absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-xl">
            <h2 id="cta-heading" className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Check Your Electricity Bill
            </h2>
            <p className="mt-3 text-pretty text-base leading-relaxed text-brand-100">
              Choose your provider, enter the number from your bill and open your official bill page.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 min-[420px]:flex-row">
              <ButtonLink href={routes.billCheck} variant="inverse" size="lg">
                Check Bill
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
              <ButtonLink href={routes.electricityBillCalculator} variant="inverse-outline" size="lg">
                Calculate Bill
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** Homepage FAQ: bill-check questions first, then calculator questions. */
export function homePageFaq() {
  return [...getBillCheckHubFaq().slice(0, 4), homeFaq[0], homeFaq[3]];
}

/** Secondary product: bill estimate, clearly separated from the real bill. */
export function CalculatorSection() {
  return (
    <Section labelledBy="calculator-heading" tone="surface">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          id="calculator-heading"
          eyebrow="Electricity tools"
          title="Estimate bills, units and appliance costs"
          description="Planning ahead or checking a high bill? Bill estimates use NEPRA-notified rates, before taxes. Your official bill is always the amount to pay."
        />
        <ButtonLink href={routes.calculators} variant="secondary" size="md" className="shrink-0 self-start sm:self-auto">
          All calculators
          <ArrowRightIcon className="size-4" />
        </ButtonLink>
      </div>
      <div className="mt-8">
        <ToolGrid from="home" />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const GUIDE_LINKS = [
  {
    href: routes.referenceNumberGuide,
    title: "Find your reference number",
    text: "Which number each provider’s official bill page accepts, and how many digits it has.",
  },
  {
    href: routes.billExplainedGuide,
    title: "Understand your electricity bill",
    text: "Units, slabs, fixed charges, fuel and quarterly adjustments and taxes, explained.",
  },
] as const;

export function GuidesSection() {
  return (
    <Section labelledBy="guides-heading">
      <SectionHeading id="guides-heading" eyebrow="Guides" title="Bill guides" />
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {GUIDE_LINKS.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[var(--shadow-raised)] sm:p-6"
            >
              <h3 className="flex items-center justify-between gap-3 text-base font-semibold text-ink-950">
                {g.title}
                <ArrowRightIcon className="size-4 text-ink-400 group-hover:text-brand-700" />
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{g.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
