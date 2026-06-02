"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LocationData = {
  id?: string;
  name: string;
  street?: string;
  city: string;
  region: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  primaryCategory?: string;
};

export function LocationForm({
  initial,
  onDone,
}: {
  initial?: LocationData;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      street: form.get("street"),
      city: form.get("city"),
      region: form.get("region"),
      postalCode: form.get("postalCode"),
      phone: form.get("phone"),
      website: form.get("website"),
      primaryCategory: form.get("primaryCategory"),
    };

    const res = await fetch(
      isEdit ? `/api/locations/${initial!.id}` : "/api/locations",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }

    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Business name</label>
        <Input name="name" required defaultValue={initial?.name} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Street</label>
        <Input name="street" defaultValue={initial?.street} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">City</label>
          <Input name="city" required defaultValue={initial?.city} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">State</label>
          <Input name="region" required defaultValue={initial?.region} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ZIP</label>
          <Input name="postalCode" defaultValue={initial?.postalCode} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <Input name="phone" defaultValue={initial?.phone} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
          <Input name="website" type="url" defaultValue={initial?.website} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Primary category</label>
        <Input
          name="primaryCategory"
          defaultValue={initial?.primaryCategory}
          placeholder="Plumber"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : isEdit ? "Update location" : "Add location"}
      </Button>
    </form>
  );
}
