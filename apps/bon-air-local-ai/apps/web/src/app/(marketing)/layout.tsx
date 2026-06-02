import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getAppUrl } from "@/lib/env";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Bon Air Local AI — Local SEO Operating System",
  description:
    "AI-powered GEO pages, Google Business Profile automation, and multi-location local SEO for agencies and brands.",
  openGraph: {
    title: "Bon Air Local AI — Rank locally. Scale programmatically.",
    description:
      "Programmatic GEO pages, GBP drafts, and usage-metered AI for local SEO teams.",
    url: appUrl,
    siteName: "Bon Air Local AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bon Air Local AI",
    description: "AI-first local SEO: GEO pages, GBP automation, multi-tenant workflows.",
  },
  robots: { index: true, follow: true },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
