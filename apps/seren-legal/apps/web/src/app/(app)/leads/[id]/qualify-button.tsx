"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function QualifyButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function qualify() {
    setLoading(true);
    try {
      await api(`/api/leads/${leadId}/qualify`, { method: "POST" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Qualification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={qualify} disabled={loading} size="sm">
      <Sparkles className="h-4 w-4" />
      {loading ? "Qualifying…" : "AI Qualify"}
    </Button>
  );
}
