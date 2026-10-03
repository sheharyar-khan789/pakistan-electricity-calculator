/**
 * Central route map. Every internal link should use these constants so a URL
 * change only ever happens in one place.
 */
export const routes = {
  home: "/",
  billCheck: "/electricity-bill-check",
  electricityBillCalculator: "/electricity-bill-calculator",
  unitCalculator: "/electricity-unit-calculator",
  applianceCalculator: "/appliance-electricity-calculator",
  acCalculator: "/ac-electricity-cost-calculator",
  touCalculator: "/tou-electricity-bill-calculator",
  calculators: "/calculators",
  providers: "/providers",
  guides: "/guides",
  referenceNumberGuide: "/guides/electricity-bill-reference-number",
  billExplainedGuide: "/guides/understand-your-electricity-bill",
  about: "/about",
  methodology: "/methodology",
  sources: "/sources",
  contact: "/contact",
  privacyPolicy: "/privacy-policy",
  terms: "/terms",
  disclaimer: "/disclaimer",
} as const;

export type StaticRoute = (typeof routes)[keyof typeof routes];

export type NavItem = {
  label: string;
  href: string;
};

export const primaryNav: readonly NavItem[] = [
  { label: "Home", href: routes.home },
  { label: "Bill Check", href: routes.billCheck },
  { label: "Calculators", href: routes.calculators },
  { label: "Providers", href: routes.providers },
  { label: "Guides", href: routes.guides },
  { label: "About", href: routes.about },
];

export const footerNav: readonly { heading: string; items: readonly NavItem[] }[] = [
  {
    heading: "Bills",
    items: [
      { label: "Electricity Bill Check", href: routes.billCheck },
      { label: "Find Your Reference Number", href: routes.referenceNumberGuide },
      { label: "Understand Your Bill", href: routes.billExplainedGuide },
    ],
  },
  {
    heading: "Calculators",
    items: [
      { label: "Electricity Bill Calculator", href: routes.electricityBillCalculator },
      { label: "TOU Bill Calculator (5 kW+)", href: routes.touCalculator },
      { label: "Unit Calculator", href: routes.unitCalculator },
      { label: "Appliance Calculator", href: routes.applianceCalculator },
      { label: "AC Cost Calculator", href: routes.acCalculator },
      { label: "All Calculators", href: routes.calculators },
    ],
  },
  {
    heading: "Learn",
    items: [
      { label: "Guides", href: routes.guides },
      { label: "Electricity Providers", href: routes.providers },
      { label: "Methodology", href: routes.methodology },
      { label: "Sources", href: routes.sources },
    ],
  },
  {
    heading: "Website",
    items: [
      { label: "About", href: routes.about },
      { label: "Contact", href: routes.contact },
      { label: "Disclaimer", href: routes.disclaimer },
      { label: "Privacy Policy", href: routes.privacyPolicy },
      { label: "Terms of Use", href: routes.terms },
    ],
  },
];
