"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  planCode: string;
  interval?: "monthly" | "annual";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
};

export function CheckoutButton({
  planCode,
  interval = "monthly",
  variant = "primary",
  className,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" variant={variant} onClick={onClick} disabled={loading}>
        {loading ? "Redirecting…" : children}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
