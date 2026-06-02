"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeoPageContent } from "@/lib/ai";

type Page = {
  id: string;
  title: string;
  metaDescription: string | null;
  status: string;
  slug: string;
  content: GeoPageContent;
};

export function GeoPageEditor({ page }: { page: Page }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [metaDescription, setMetaDescription] = useState(
    page.metaDescription ?? ""
  );
  const [status, setStatus] = useState(page.status);
  const [content] = useState(page.content);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/geo-pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        metaDescription,
        status,
        content,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Save failed");
      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Page settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Meta description</label>
            <Input
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">Slug: /{page.slug}</p>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {message && (
            <p className="text-sm text-brand-700">{message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 prose prose-sm max-w-none">
          <div>
            <h2 className="text-lg font-bold">{content.hero.headline}</h2>
            <p className="text-slate-600">{content.hero.subheadline}</p>
          </div>
          {content.sections.map((s, i) => (
            <div key={i}>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-slate-600">{s.body}</p>
            </div>
          ))}
          <div>
            <h3 className="font-semibold">FAQs</h3>
            <ul className="mt-2 space-y-2">
              {content.faqs.map((f, i) => (
                <li key={i} className="text-sm">
                  <strong>{f.question}</strong>
                  <p className="text-slate-600">{f.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
