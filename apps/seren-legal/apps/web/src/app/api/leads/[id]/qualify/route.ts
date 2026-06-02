import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { qualifyLead } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { auditLog, tenantWhere } from "@/lib/tenant";
import { contactName } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (session) => {
    const { id } = await params;
    const lead = await prisma.lead.findFirst({
      where: { id, ...tenantWhere(session!) },
      include: { contact: true },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const qualification = await qualifyLead(
      {
        contactName: contactName(lead.contact.firstName, lead.contact.lastName),
        practiceArea: lead.practiceArea,
        source: lead.source,
        caseTypeDetail: lead.caseTypeDetail,
        caseSummary: lead.caseSummary,
      },
      { tenantId: session!.tenantId, userId: session!.sub }
    );

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        score: qualification.score,
        urgency: qualification.urgency,
        practiceArea: qualification.practiceArea,
        caseSummary: qualification.caseSummary,
        caseTypeDetail: qualification.caseTypeDetail || lead.caseTypeDetail,
        estimatedValue: qualification.estimatedValue,
        status: qualification.score >= 70 ? "qualified" : lead.status,
      },
      include: { contact: true, pipelineStage: true },
    });

    await auditLog({
      tenantId: session!.tenantId,
      userId: session!.sub,
      action: "lead.qualified",
      entityType: "lead",
      entityId: id,
      changes: { qualification },
    });

    return NextResponse.json({ lead: updated, qualification });
  });
}
