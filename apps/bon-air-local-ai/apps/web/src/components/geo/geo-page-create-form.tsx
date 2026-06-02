"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Location = { id: string; name: string };

export function GeoPageCreateForm({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/geo-pages/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId: form.get("locationId"),
        pageType: form.get("pageType"),
        targetCity: form.get("targetCity"),
        targetRegion: form.get("targetRegion"),
        service: form.get("service") || undefined,
        save: true,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Generation failed");
      return;
    }

    router.push(`/app/geo-pages/${data.page.id}`);
    router.refresh();
  }

  if (locations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">
            Add a business location first before generating GEO pages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI GEO page generator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="max-w-lg space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Location</label>
            <select
              name="locationId"
              required
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Page type</label>
            <select
              name="pageType"
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              defaultValue="city_service"
            >
              <option value="city_service">City + service</option>
              <option value="neighborhood">Neighborhood</option>
              <option value="service_area">Service area</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Target city</label>
              <Input name="targetCity" required placeholder="Richmond" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">State / region</label>
              <Input name="targetRegion" required placeholder="VA" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Service (optional)
            </label>
            <Input name="service" placeholder="Emergency plumbing" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Generating…" : "Generate with AI"}
          </Button>
          <p className="text-xs text-slate-500">
            Uses OpenAI when OPENAI_API_KEY is set; otherwise uses built-in templates.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
