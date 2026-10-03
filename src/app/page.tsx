import { buildMetadata } from "@/lib/seo/metadata";
import { faqPageSchema, webSiteSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeHero } from "@/components/home/HomeHero";
import {
  CalculatorSection,
  FaqSection,
  FeaturesSection,
  FinalCtaSection,
  GuidesSection,
  homePageFaq,
  HowItWorksSection,
  MethodologySection,
  ProvidersSection,
} from "@/components/home/HomeSections";

export const metadata = buildMetadata({
  title: "Check Electricity Bill Online in Pakistan | PK Utility Calculator",
  description:
    "Check your electricity bill online in Pakistan. Choose your provider, enter your reference number or Customer ID and open the official bill page. Estimate bills from units too.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={[webSiteSchema(), faqPageSchema(homePageFaq())]} />
      <HomeHero />
      <ProvidersSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CalculatorSection />
      <GuidesSection />
      <MethodologySection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
