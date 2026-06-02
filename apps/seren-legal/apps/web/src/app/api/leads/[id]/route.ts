import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { auditLog, tenantWhere } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withAuth(request, async (session) => {
    const { id } = await params;
    const lead = await prisma.lead.findFirst({
      where: { id, ...tenantWhere(session!) },
      include: {
        contact: true,
        pipelineStage: true,
        assignedAttorney: { include: { user: true } },
        intakeSessions: { orderBy: { createdAt: "desc" }, take: 5 },
        communications: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lead });
  });
}

const patchSchema = z.object({
  status: z.string().optional(),
  score: z.number().optional(),
  urgency: z.string().optional(),
  caseSummary: z.string().optional(),
  caseTypeDetail: z.string().optional(),
  practiceArea: z.string().optional(),
  pipelineStageId: z.string().uuid().optional(),
  assignedAttorneyId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(request, async (session) => {
    const { id } = await params;
    const existing = await prisma.lead.findFirst({
      where: { id, ...tenantWhere(session!) },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = patchSchema.parse(await request.json());
    const lead = await prisma.lead.update({
      where: { id },
      data: body,
      include: { contact: true, pipelineStage: true },
    });

    await auditLog({
      tenantId: session!.tenantId,
      userId: session!.sub,
      action: "lead.updated",
      entityType: "lead",
      entityId: id,
      changes: { before: existing, after: lead },
    });

    return NextResponse.json({ lead });
  });
}
