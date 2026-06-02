import Link from "next/link";
import {
  MapPin,
  Sparkles,
  BarChart3,
  Megaphone,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SocialProofSection,
  TestimonialsSection,
  FaqSection,
  FinalCtaSection,
} from "@/components/marketing/landing-sections";

const features = [
  {
    icon: FileText,
    title: "AI GEO Page Generator",
    description:
      "City, neighborhood, and service-area landing pages with schema, FAQs, and internal links — generated in minutes.",
  },
  {
    icon: Megaphone,
    title: "GBP Post Automation",
    description:
      "AI-drafted Google Business Profile posts with scheduling, publish workflow, and consistent brand voice.",
  },
  {
    icon: MapPin,
    title: "Multi-Location Hub",
    description:
      "Manage every client location from one tenant-scoped dashboard built for agencies and multi-unit brands.",
  },
  {
    icon: BarChart3,
    title: "Local SEO Command Center",
    description:
      "Track GEO pages, GBP activity, and AI usage — with audit trails and Stripe-backed usage metering.",
  },
  {
    icon: Sparkles,
    title: "Template + OpenAI",
    description:
      "Ship instantly with smart templates; plug in OpenAI for premium copy when you're ready.",
  },
  {
    icon: Shield,
    title: "Tenant-Scoped Security",
    description:
      "JWT auth, refresh tokens, and per-tenant data isolation from day one.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="gradient-hero px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-flex items-center rounded-full bg-brand-100 px-4 py-1 text-sm font-medium text-brand-800">
            AI-first Local SEO Operating System
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Rank locally.{" "}
            <span className="text-brand-700">Scale programmatically.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Bon Air Local AI combines GEO page generation, GBP automation, and
            multi-tenant workflows — so agencies and local brands ship local SEO
            faster than manual spreadsheets ever could.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg">Start free trial</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary">
                View pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SocialProofSection />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Everything local SEO teams need
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
          One platform for programmatic pages, GBP posts, and client-ready reporting.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
