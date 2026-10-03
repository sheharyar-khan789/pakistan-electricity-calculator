import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const rootDescription =
  "Estimate your electricity bill in Pakistan from units used, with slab rates and taxes for LESCO, IESCO, MEPCO, K-Electric and more, or check your bill online.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: rootDescription,
  applicationName: siteConfig.name,
  // Only providers the site actually supports.
  keywords: [
    "electricity bill calculator Pakistan",
    "electricity bill check online",
    "electricity unit calculator",
    "WAPDA bill calculator",
    "LESCO bill",
    "IESCO bill",
    "MEPCO bill",
    "FESCO bill",
    "GEPCO bill",
    "PESCO bill",
    "HESCO bill",
    "SEPCO bill",
    "QESCO bill",
    "TESCO bill",
    "HAZECO bill",
    "K-Electric bill",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: siteConfig.name,
    description: rootDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: rootDescription,
  },
  robots: siteConfig.indexingEnabled
    ? { index: true, follow: true }
    : { index: false, follow: false },
  formatDetection: { telephone: false },
  // Google Search Console HTML-tag verification (only when configured).
  ...(siteConfig.googleSiteVerification
    ? { verification: { google: siteConfig.googleSiteVerification } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#0a1626",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PK" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink-950 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
