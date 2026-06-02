import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getAppUrl } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: {
    default: "Seren Legal — AI-Powered Legal CRM",
    template: "%s | Seren Legal",
  },
  description:
    "Multi-tenant law firm SaaS for leads, AI intake, pipeline, communications, and Stripe billing.",
  openGraph: {
    title: "Seren Legal — Turn every lead into a retained client",
    description:
      "AI qualification, Kanban pipeline, embeddable intake widget, and Twilio-ready SMS.",
    url: appUrl,
    siteName: "Seren Legal",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seren Legal",
    description: "AI-first legal CRM for modern law firms.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
