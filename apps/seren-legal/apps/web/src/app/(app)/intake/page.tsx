import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { contactName, formatDate, formatRelative } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function IntakePage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const [sessions, tenant] = await Promise.all([
    prisma.intakeSession.findMany({
      where: tenantWhere(session),
      include: { contact: true, lead: { include: { contact: true } }, form: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { slug: true, name: true } }),
  ]);

  const statusColor: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-800",
    in_progress: "bg-amber-100 text-amber-800",
    abandoned: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Intake</h1>
          <p className="text-slate-500">Sessions from chatbot, forms, and manual entry</p>
        </div>
        {tenant && (
          <Link
            href={`/widget/chat/${tenant.slug}`}
            target="_blank"
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            Open chatbot widget →
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {sessions.map((s) => (
          <Card key={s.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">
                {s.contact
                  ? contactName(s.contact.firstName, s.contact.lastName)
                  : s.lead
                    ? contactName(s.lead.contact.firstName, s.lead.contact.lastName)
                    : "Anonymous"}
              </CardTitle>
              <Badge className={statusColor[s.status] ?? "bg-slate-100"}>{s.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-500">
                {s.channel} · {formatRelative(s.createdAt)}
                {s.completedAt && ` · completed ${formatDate(s.completedAt)}`}
              </p>
              {s.aiSummary && <p className="text-slate-700">{s.aiSummary}</p>}
              {s.aiScore != null && (
                <p className="font-medium text-indigo-600">AI score: {s.aiScore}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {sessions.length === 0 && (
          <p className="text-slate-500">No intake sessions yet. Share your chatbot widget to get started.</p>
        )}
      </div>
    </div>
  );
}
