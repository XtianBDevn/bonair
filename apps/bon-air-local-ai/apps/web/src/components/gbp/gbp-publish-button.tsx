"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GbpPublishButton({ postId, status }: { postId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "published") return null;

  async function publish() {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/gbp/posts/${postId}/publish`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Publish failed");
      return;
    }
    setMessage(data.publish?.message ?? "Published");
    router.refresh();
  }

  return (
    <div className="mt-3">
      <Button type="button" size="sm" variant="secondary" onClick={publish} disabled={loading}>
        {loading ? "Publishing…" : "Publish to GBP"}
      </Button>
      {message && <p className="mt-1 text-xs text-slate-500">{message}</p>}
    </div>
  );
}
