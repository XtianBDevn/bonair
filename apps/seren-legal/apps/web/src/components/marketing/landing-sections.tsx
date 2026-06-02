import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const testimonials = [
  {
    quote:
      "Seren cut our intake-to-consultation time in half. AI qualification surfaces the cases we should call back first.",
    name: "Jordan Smith",
    role: "Managing Partner, Smith & Associates",
  },
  {
    quote:
      "The embeddable chat widget alone paid for the platform — we capture after-hours leads we used to lose.",
    name: "Elena Vasquez",
    role: "Office Manager, Vasquez Injury Law",
  },
  {
    quote:
      "Pipeline Kanban plus communications in one place replaced three tools. Our staff actually uses it.",
    name: "David Park",
    role: "Operations Director, Park Family Law",
  },
];

export const faqs = [
  {
    q: "Is Seren Legal built for multi-attorney firms?",
    a: "Yes. Every record is tenant-scoped to your firm with role-based access, pipeline stages, and per-plan limits on users and attorneys.",
  },
  {
    q: "Does the intake chatbot create leads automatically?",
    a: "When a visitor completes the widget flow, Seren creates a contact, lead, and intake session with AI summary, urgency, and practice area.",
  },
  {
    q: "Can we send SMS from the platform?",
    a: "Outbound SMS uses Twilio when credentials are configured. Without Twilio, messages are logged in dev stub mode for testing workflows.",
  },
  {
    q: "How does billing work?",
    a: "Stripe Checkout and the customer portal handle subscriptions. Usage events track AI credits against your plan.",
  },
];

export function SocialProofSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-500">
          Built for plaintiff, criminal, and family law firms
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-slate-600">
          {["Smith & Associates", "Capitol Injury", "Bay State Family", "Midwest DUI Defense"].map(
            (name) => (
              <span key={name} className="text-lg font-semibold">
                {name}
              </span>
            )
          )}
        </div>
        <div className="mt-8 flex justify-center gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-current" />
          ))}
          <span className="ml-2 text-sm text-slate-400">Loved by intake coordinators</span>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-2xl font-bold text-white">What firms are saying</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-slate-800 bg-[#0f172a] p-6"
          >
            <Quote className="mb-3 h-8 w-8 text-indigo-500/50" />
            <p className="text-sm text-slate-400">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-4 font-semibold text-white">{t.name}</p>
            <p className="text-xs text-slate-500">{t.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="border-t border-slate-800 bg-slate-900/30 px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold text-white">FAQ</h2>
        <dl className="mt-10 space-y-6">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold text-white">{item.q}</dt>
              <dd className="mt-2 text-sm text-slate-400">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="px-6 py-20 text-center">
      <h2 className="text-3xl font-bold text-white">Ready to modernize your firm?</h2>
      <p className="mx-auto mt-4 max-w-xl text-slate-400">
        Start your 14-day trial. Embed the intake widget on your site in minutes.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/signup">
          <Button size="lg">Start free trial</Button>
        </Link>
        <Link href="/pricing">
          <Button
            variant="outline"
            size="lg"
            className="border-slate-600 bg-transparent text-white hover:bg-slate-800"
          >
            View pricing
          </Button>
        </Link>
      </div>
    </section>
  );
}
