import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const testimonials = [
  {
    quote:
      "We went from 4 city pages to 40 in a quarter. Bon Air Local AI cut our content production time by 80% without sacrificing local relevance.",
    name: "Rachel Torres",
    role: "Director of SEO, Tidewater Home Services",
  },
  {
    quote:
      "GBP drafts used to sit in a spreadsheet. Now every location gets consistent posts — our Maps impressions are up 34% YoY.",
    name: "Marcus Chen",
    role: "Agency Owner, LocalLift Digital",
  },
  {
    quote:
      "Template mode let us onboard clients day one. OpenAI mode is our upsell when they want premium copy at scale.",
    name: "Amy Walsh",
    role: "VP Marketing, Piedmont HVAC Group",
  },
];

export const faqs = [
  {
    q: "Do I need OpenAI to use Bon Air Local AI?",
    a: "No. Built-in templates generate production-ready GEO pages and GBP drafts. Add OPENAI_API_KEY when you want GPT-powered copy.",
  },
  {
    q: "Can agencies manage multiple clients?",
    a: "Yes. Each workspace is tenant-scoped with agency mode, multiple locations, and plan-based limits for GEO pages and AI credits.",
  },
  {
    q: "Does this publish directly to Google Business Profile?",
    a: "Phase 2 includes a publish workflow with stub mode for testing. Connect GBP OAuth for live posts when your Google project is approved.",
  },
  {
    q: "How does billing work?",
    a: "Stripe Checkout handles subscriptions. Usage metering tracks AI generations and page volume against your plan limits.",
  },
];

export function SocialProofSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-500">
          Trusted by local SEO teams & multi-location brands
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-slate-400">
          {["LocalLift", "Tidewater Home", "Piedmont HVAC", "Capitol Contractors", "Bay Area Auto"].map(
            (name) => (
              <span key={name} className="text-lg font-semibold tracking-tight">
                {name}
              </span>
            )
          )}
        </div>
        <div className="mt-10 flex justify-center gap-1 text-amber-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-current" />
          ))}
          <span className="ml-2 text-sm text-slate-600">4.9/5 from agency beta partners</span>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-bold text-slate-900">What local marketers say</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name}>
            <CardContent className="pt-6">
              <Quote className="mb-3 h-8 w-8 text-brand-200" />
              <p className="text-sm text-slate-600">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-500">{t.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold text-slate-900">Frequently asked questions</h2>
        <dl className="mt-10 space-y-6">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold text-slate-900">{item.q}</dt>
              <dd className="mt-2 text-sm text-slate-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="border-t border-slate-200 bg-brand-800 px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to own your local market?</h2>
        <p className="mt-4 text-brand-100">
          Launch your workspace in under two minutes. Connect OpenAI when you want premium AI copy.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="bg-white text-brand-800 hover:bg-brand-50">
              Create your workspace
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="ghost" className="text-white hover:bg-brand-700">
              Compare plans
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
