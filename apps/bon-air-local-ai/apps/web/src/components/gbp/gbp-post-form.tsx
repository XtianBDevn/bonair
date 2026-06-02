"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Location = { id: string; name: string };

export function GbpPostForm({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);

  async function draftWithAi() {
    if (!topic || !locationId) return;
    setDrafting(true);
    setError(null);
    const res = await fetch("/api/gbp/posts/draft-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId, topic }),
    });
    const data = await res.json();
    setDrafting(false);
    if (!res.ok) {
      setError(data.error ?? "Draft failed");
      return;
    }
    setBody(data.body);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/gbp/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId,
        topic,
        body,
        status: "draft",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    setTopic("");
    setBody("");
    router.refresh();
  }

  if (locations.length === 0) {
    return (
      <p className="text-sm text-slate-500">Add a location before creating GBP posts.</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Location</label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Topic</label>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          placeholder="Spring plumbing checkup"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">Post body</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={draftWithAi}
            disabled={drafting || !topic}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            {drafting ? "Drafting…" : "AI draft"}
          </Button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save draft"}
      </Button>
    </form>
  );
}
