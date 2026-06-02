import Link from "next/link";
import { ArrowRight, Bot, Kanban, Phone, Shield } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { Button } from "@/components/ui/button";
import {
  SocialProofSection,
  TestimonialsSection,
  FaqSection,
  FinalCtaSection,
} from "@/components/marketing/landing-sections";

const features = [
  {
    icon: Bot,
    title: "AI qualification",
    desc: "Score leads and detect urgency in seconds with OpenAI or built-in heuristics.",
  },
  {
    icon: Kanban,
    title: "Pipeline Kanban",
    desc: "Visual deal flow from new lead to retained — drag, drop, and audit every move.",
  },
  {
    icon: Phone,
    title: "Communications hub",
    desc: "SMS, calls, and follow-ups in one timeline with Twilio-ready outbound SMS.",
  },
  {
    icon: Shield,
    title: "Tenant isolation",
    desc: "Multi-tenant architecture with audit logging and firm-scoped data.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <MarketingHeader />
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-indigo-400">
          AI-first legal operations
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Turn every lead into a{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            retained client
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Seren Legal unifies intake, pipeline, communications, and AI qualification in one
          platform built for modern law firms — from solo practitioners to multi-attorney teams.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">
              Start 14-day trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white"
            >
              View demo
            </Button>
          </Link>
        </div>
      </section>

      <SocialProofSection />

      <section className="border-t border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
              <f.icon className="mb-4 h-8 w-8 text-indigo-400" />
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection />

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/pricing" className="hover:text-indigo-400">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-indigo-400">
            Log in
          </Link>
          <a href="mailto:legal@serenlegal.ai" className="hover:text-indigo-400">
            Privacy
          </a>
          <a href="mailto:legal@serenlegal.ai" className="hover:text-indigo-400">
            Terms
          </a>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Seren Legal. All rights reserved.</p>
      </footer>
    </div>
  );
}
