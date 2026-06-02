"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationForm } from "@/components/locations/location-form";

type LocationData = {
  id: string;
  name: string;
  street?: string;
  city: string;
  region: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  primaryCategory?: string;
};

export function LocationRow({ location }: { location: LocationData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function remove() {
    if (!confirm(`Delete ${location.name}?`)) return;
    await fetch(`/api/locations/${location.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-slate-200 p-4">
        <LocationForm
          initial={location}
          onDone={() => setEditing(false)}
        />
        <button
          type="button"
          className="mt-2 text-sm text-slate-500 hover:underline"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between rounded-lg border border-slate-200 p-4">
      <div>
        <p className="font-medium text-slate-900">{location.name}</p>
        <p className="text-sm text-slate-600">
          {[location.city, location.region].filter(Boolean).join(", ")}
        </p>
        {location.primaryCategory && (
          <p className="text-xs text-slate-500">{location.primaryCategory}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={remove} aria-label="Delete">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </li>
  );
}
