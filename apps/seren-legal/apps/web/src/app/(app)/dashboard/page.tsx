import Link from "next/link";
import { ArrowUpRight, Users, Zap, MessageSquare, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { contactName, formatRelative, practiceAreaLabel, urgencyColor } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const where = tenantWhere(session);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalLeads, newLeads, qualified, highUrgency, comms, recentLeads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { ...where, status: "qualified" } }),
    prisma.lead.count({ where: { ...where, urgency: { in: ["high", "critical"] } } }),
    prisma.communication.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
    prisma.lead.findMany({
      where,
      include: { contact: true, pipelineStage: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Total leads", value: totalLeads, icon: Users, color: "text-indigo-600" },
    { label: "New this week", value: newLeads, icon: Zap, color: "text-amber-600" },
    { label: "Qualified", value: qualified, icon: Target, color: "text-emerald-600" },
    { label: "High urgency", value: highUrgency, icon: ArrowUpRight, color: "text-red-600" },
    { label: "Comms (7d)", value: comms, icon: MessageSquare, color: "text-violet-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your firm&apos;s pipeline and activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-lg bg-slate-100 p-3 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent leads</CardTitle>
          <Link href="/leads" className="text-sm font-medium text-indigo-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {contactName(lead.contact.firstName, lead.contact.lastName)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {practiceAreaLabel(lead.practiceArea)} · {lead.pipelineStage?.name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={urgencyColor(lead.urgency)}>{lead.urgency}</Badge>
                  <span className="text-sm font-medium text-indigo-600">{lead.score}</span>
                  <span className="text-xs text-slate-400">{formatRelative(lead.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
