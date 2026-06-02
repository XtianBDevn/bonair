import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckoutButton } from "@/components/billing/checkout-button";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "Solo operators and single-location businesses.",
    features: [
      "3 business locations",
      "25 GEO pages / month",
      "50 GBP posts / month",
      "500 AI credits",
      "Template + OpenAI generation",
    ],
    cta: "Start trial",
    planCode: "starter",
    highlighted: false,
  },
  {
    name: "Agency",
    price: "$149",
    period: "/mo",
    description: "Multi-client agencies with white-label ambitions.",
    features: [
      "25 locations",
      "200 GEO pages / month",
      "Unlimited GBP drafts",
      "5,000 AI credits",
      "Priority support (coming soon)",
    ],
    cta: "Start trial",
    planCode: "agency",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Franchise and enterprise local programs.",
    features: [
      "Unlimited locations",
      "Custom AI models",
      "SSO & advanced RBAC",
      "Dedicated success manager",
    ],
    cta: "Contact sales",
    planCode: null,
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Subscribe via Stripe Checkout. Manage your plan anytime from Settings.
        </p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted
                ? "border-brand-500 ring-2 ring-brand-500/20"
                : undefined
            }
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {plan.price}
                <span className="text-base font-normal text-slate-500">
                  {plan.period}
                </span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.planCode ? (
                  <CheckoutButton
                    planCode={plan.planCode}
                    variant={plan.highlighted ? "primary" : "secondary"}
                    className="w-full [&_button]:w-full"
                  >
                    {plan.cta}
                  </CheckoutButton>
                ) : (
                  <Link href="/signup" className="block">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "primary" : "secondary"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
