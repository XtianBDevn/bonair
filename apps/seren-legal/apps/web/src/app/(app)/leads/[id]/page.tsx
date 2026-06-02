import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QualifyButton } from "./qualify-button";
import { RequestReviewButton } from "./request-review-button";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import {
  contactName,
  formatCurrency,
  formatDate,
  practiceAreaLabel,
  urgencyColor,
} from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, ...tenantWhere(session) },
    include: {
      contact: true,
      pipelineStage: true,
      assignedAttorney: { include: { user: true } },
      intakeSessions: { orderBy: { createdAt: "desc" }, take: 3 },
      communications: { orderBy: { createdAt: "desc" }, take: 5 },
      reviewRequests: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {contactName(lead.contact.firstName, lead.contact.lastName)}
          </h1>
          <p className="text-slate-500">
            {practiceAreaLabel(lead.practiceArea)} · {lead.caseTypeDetail ?? "No case detail"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={urgencyColor(lead.urgency)}>{lead.urgency}</Badge>
          <span className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
            Score {lead.score}
          </span>
          <QualifyButton leadId={lead.id} />
          <RequestReviewButton leadId={lead.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Case details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-medium capitalize">{lead.status.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pipeline stage</span>
              <span className="font-medium">{lead.pipelineStage?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Source</span>
              <span className="font-medium capitalize">{lead.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Est. value</span>
              <span className="font-medium">{formatCurrency(lead.estimatedValue?.toString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span className="font-medium">{formatDate(lead.createdAt)}</span>
            </div>
            {lead.caseSummary && (
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-slate-700">{lead.caseSummary}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{lead.contact.email ?? "—"}</p>
            <p>{lead.contact.phone ?? "—"}</p>
            {lead.assignedAttorney && (
              <p className="mt-2 text-slate-500">
                Assigned: {lead.assignedAttorney.user.firstName} {lead.assignedAttorney.user.lastName}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent communications</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.communications.length === 0 ? (
            <p className="text-sm text-slate-500">No communications yet.</p>
          ) : (
            <ul className="space-y-3">
              {lead.communications.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <span className="font-medium capitalize">{c.channel}</span> · {c.direction} ·{" "}
                  {formatDate(c.createdAt)}
                  {c.body && <p className="mt-1 text-slate-600">{c.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {lead.reviewRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {lead.reviewRequests.map((r) => (
                <li key={r.id} className="flex justify-between rounded-lg border border-slate-100 p-3">
                  <span className="capitalize">{r.platform}</span>
                  <span className="capitalize text-slate-500">{r.status}</span>
                  <span className="text-slate-400">{formatDate(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Intake sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.intakeSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No intake sessions.</p>
          ) : (
            <ul className="space-y-2">
              {lead.intakeSessions.map((s) => (
                <li key={s.id}>
                  <Link href="/intake" className="text-indigo-600 hover:underline">
                    {s.channel} — {s.status}
                  </Link>
                  {s.aiSummary && <p className="text-sm text-slate-500">{s.aiSummary}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
