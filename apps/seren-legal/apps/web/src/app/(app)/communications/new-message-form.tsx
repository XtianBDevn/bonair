"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { contactName } from "@/lib/utils";

type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
};

export function NewMessageForm({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/communications", {
        method: "POST",
        body: JSON.stringify({
          contactId: fd.get("contactId"),
          channel: "sms",
          direction: "outbound",
          body: fd.get("body"),
        }),
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contactId">Contact</Label>
            <select
              id="contactId"
              name="contactId"
              required
              className="mt-1 flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="">Select contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {contactName(c.firstName, c.lastName)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" required placeholder="SMS or note content…" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Log SMS"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
