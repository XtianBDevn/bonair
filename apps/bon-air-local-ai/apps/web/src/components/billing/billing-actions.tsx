"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/billing/checkout-button";

export function BillingActions({
  hasSubscription,
  stripeConfigured,
}: {
  hasSubscription: boolean;
  stripeConfigured: boolean;
}) {
  const [portalLoading, setPortalLoading] = useState(false);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  if (!stripeConfigured) {
    return (
      <p className="text-xs text-slate-500">
        Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and plan price IDs to enable billing.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {!hasSubscription && (
        <CheckoutButton planCode="starter">Subscribe to Starter</CheckoutButton>
      )}
      {hasSubscription && (
        <Button type="button" variant="secondary" onClick={openPortal} disabled={portalLoading}>
          {portalLoading ? "Loading…" : "Manage billing"}
        </Button>
      )}
    </div>
  );
}
