import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewMessageForm } from "./new-message-form";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { contactName, formatRelative } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function CommunicationsPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const [communications, contacts] = await Promise.all([
    prisma.communication.findMany({
      where: tenantWhere(session),
      include: { contact: true, lead: true, sentBy: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.contact.findMany({
      where: tenantWhere(session),
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
        <p className="text-slate-500">SMS, calls, and messages across your leads</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <NewMessageForm contacts={contacts} />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {communications.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">
                        {contactName(c.contact.firstName, c.contact.lastName)}
                      </span>
                      <span className="text-xs text-slate-400">{formatRelative(c.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex gap-2">
                      <Badge className="bg-slate-100 text-slate-700 capitalize">{c.channel}</Badge>
                      <Badge className="bg-indigo-50 text-indigo-700">{c.direction}</Badge>
                    </div>
                    {c.body && <p className="mt-2 text-sm text-slate-600">{c.body}</p>}
                  </li>
                ))}
                {communications.length === 0 && (
                  <p className="text-sm text-slate-500">No communications yet.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
