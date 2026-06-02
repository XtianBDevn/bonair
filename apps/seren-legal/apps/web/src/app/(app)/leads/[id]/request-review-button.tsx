"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function RequestReviewButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function requestReview() {
    setLoading(true);
    try {
      await api("/api/reviews/request", {
        method: "POST",
        body: JSON.stringify({ leadId, platform: "google" }),
      });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Review request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={requestReview} disabled={loading} size="sm" variant="outline">
      <Star className="h-4 w-4" />
      {loading ? "Sending…" : "Request review"}
    </Button>
  );
}
