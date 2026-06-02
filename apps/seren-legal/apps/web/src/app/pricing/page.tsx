import Link from "next/link";
import { Check } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    price: 149,
    desc: "Solo practitioners and small teams",
    features: ["Up to 3 users", "500 AI credits/mo", "Basic pipeline", "Intake forms"],
  },
  {
    name: "Professional",
    price: 299,
    desc: "Growing firms with multiple attorneys",
    features: ["Up to 10 users", "50k AI credits/mo", "Automations", "Chatbot widget", "Analytics"],
    highlighted: true,
    useCheckout: true,
  },
  {
    name: "Enterprise",
    price: 599,
    desc: "Multi-office and white-label",
    features: ["Unlimited users", "Custom AI routing", "Multi-office", "API access", "Dedicated support"],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0f172a] text-white">
        <MarketingHeader />
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-slate-400">14-day free trial on all plans. No credit card required for demo.</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted ? "border-indigo-500 ring-2 ring-indigo-500/20" : ""}
          >
            <CardHeader>
              {plan.highlighted && (
                <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                  Most popular
                </span>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-slate-500">{plan.desc}</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                <span className="text-slate-500">/mo</span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-indigo-600" />
                    {f}
                  </li>
                ))}
              </ul>
              {"useCheckout" in plan && plan.useCheckout ? (
                <CheckoutButton className="mt-6 w-full [&_button]:w-full">
                  Subscribe now
                </CheckoutButton>
              ) : (
                <Link href="/signup" className="mt-6 block">
                  <Button className="w-full" variant={plan.highlighted ? "primary" : "outline"}>
                    Get started
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
