import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { contactName, formatRelative, practiceAreaLabel, urgencyColor } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function LeadsPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: tenantWhere(session),
    include: { contact: true, pipelineStage: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500">{leads.length} total leads</p>
        </div>
        <Link href="/pipeline">
          <Button variant="outline">Pipeline view</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Contact</th>
                  <th className="pb-3 font-medium">Practice area</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Urgency</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium text-indigo-600 hover:underline">
                        {contactName(lead.contact.firstName, lead.contact.lastName)}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">{practiceAreaLabel(lead.practiceArea)}</td>
                    <td className="py-3 text-slate-600">{lead.pipelineStage?.name ?? "—"}</td>
                    <td className="py-3 font-medium">{lead.score}</td>
                    <td className="py-3">
                      <Badge className={urgencyColor(lead.urgency)}>{lead.urgency}</Badge>
                    </td>
                    <td className="py-3 capitalize text-slate-600">{lead.source}</td>
                    <td className="py-3 text-slate-500">{formatRelative(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
