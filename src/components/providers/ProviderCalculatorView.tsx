import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/config/routes";
import { providerCalculatorStatus } from "@/data/calculators";
import { getProviderFaq } from "@/data/provider-faq";
import { providerCalculatorPath, type Provider } from "@/data/providers";
import { billCheckPath, getBillCheck } from "@/lib/bill-check/registry";
import { getDefaultBillingMonth } from "@/lib/calculator/engine-registry";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqPageSchema, webApplicationSchema } from "@/lib/seo/schema";
import { CalculatorStatusBadge } from "@/components/calculator/CalculatorStatusBadge";
import {
  EngineStatusNotice,
  FindUnitsTip,
  ProviderLinks,
  ResultExplainer,
  TariffSourcesPending,
} from "@/components/calculator/CalculatorPageSections";
import { ElectricityCalculator } from "@/components/calculator/ElectricityCalculator";
import { JsonLd } from "@/components/seo/JsonLd";
import { AdjustmentsTable, TariffRatesTable } from "@/components/tariffs/TariffTables";
import { Alert } from "@/components/ui/Alert";
import { FaqList } from "@/components/ui/FaqList";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProviderFacts } from "./ProviderFacts";

export function describeProvider(provider: Provider): string {
  return provider.shortName === provider.fullName ? provider.fullName : `${provider.fullName} (${provider.shortName})`;
}

export function providerCalculatorMetadata(provider: Provider): Metadata {
  return buildMetadata({
    title: `${provider.shortName} Bill Calculator`,
    description: `Estimate your ${describeProvider(provider)} electricity bill from units or meter readings, with a breakdown of charges and adjustments before taxes.`,
    path: providerCalculatorPath(provider),
    // Not indexable until this provider's calculation engine is live.
    indexable: providerCalculatorStatus(provider.id) === "available",
  });
}

/** /<provider>-bill-calculator — the secondary, estimate-only tool. */
export function ProviderCalculatorView({ provider }: { provider: Provider }) {
  const status = providerCalculatorStatus(provider.id);
  const available = status === "available";
  const title = `${provider.shortName} Bill Calculator`;
  const path = providerCalculatorPath(provider);
  const billingMonth = getDefaultBillingMonth();
  const faq = available && billingMonth ? getProviderFaq(provider.id, billingMonth) : [];
  const billCheck = getBillCheck(provider.id);

  return (
    <>
      {available ? (
        <JsonLd data={webApplicationSchema({ name: title, description: `Estimate a ${describeProvider(provider)} electricity bill.`, path })} />
      ) : null}
      {faq.length > 0 ? <JsonLd data={faqPageSchema(faq)} /> : null}
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Calculators", path: routes.calculators },
          { name: title, path },
        ]}
        title={title}
        meta={<CalculatorStatusBadge status={status} />}
        lead={`Estimate your ${describeProvider(provider)} electricity bill. Choose your consumer type, then enter the units you used or your meter readings.`}
      />

      <Container className="space-y-8 py-8 sm:py-12">
        {billCheck?.status === "supported" ? (
          <Alert tone="info" title={`Want your actual ${provider.shortName} bill?`}>
            This calculator gives an estimate only. To see the amount you actually owe, use the{" "}
            <Link href={billCheckPath(billCheck)}>{provider.shortName} bill check</Link>.
          </Alert>
        ) : null}
        {!available ? <EngineStatusNotice providerName={provider.shortName} /> : null}
        <ElectricityCalculator layout="split" initialProviderId={provider.id} defaultBillingMonth={billingMonth} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ProviderFacts
            provider={provider}
            headingId="provider-facts-heading"
            rows={[{ label: "Tariff data", value: available ? "Verified and connected" : "Being verified" }]}
          />
          <div className="space-y-6">
            <FindUnitsTip />
            {!available ? <TariffSourcesPending /> : null}
          </div>
        </div>

        {available && billingMonth ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <TariffRatesTable providerId={provider.id} billingMonth={billingMonth} headingId="tariff-rates-heading" />
            <AdjustmentsTable providerId={provider.id} headingId="adjustments-heading" />
          </div>
        ) : null}

        <ResultExplainer />

        {faq.length > 0 ? (
          <section aria-labelledby="provider-faq-heading" className="space-y-4">
            <h2 id="provider-faq-heading" className="text-xl font-semibold tracking-tight text-ink-950">
              {provider.shortName} bill calculator FAQ
            </h2>
            <FaqList items={faq} />
          </section>
        ) : null}

        <ProviderLinks excludeId={provider.id} headingId="other-providers-heading" />
      </Container>
    </>
  );
}
