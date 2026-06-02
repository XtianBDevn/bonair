import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { auditLog, tenantWhere } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ stageId: z.string().uuid() });

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (session) => {
    const { id } = await params;
    const body = schema.parse(await request.json());

    const stage = await prisma.pipelineStage.findFirst({
      where: { id: body.stageId, ...tenantWhere(session!) },
    });
    if (!stage) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    const lead = await prisma.lead.findFirst({
      where: { id, ...tenantWhere(session!) },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const statusMap: Record<string, string> = {
      "New Lead": "new",
      Contacted: "contacted",
      Qualified: "qualified",
      Consultation: "consultation_booked",
      Retained: "retained",
      Lost: "lost",
    };

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        pipelineStageId: stage.id,
        status: statusMap[stage.name] ?? lead.status,
        retainedAt: stage.name === "Retained" ? new Date() : lead.retainedAt,
      },
      include: { contact: true, pipelineStage: true },
    });

    await auditLog({
      tenantId: session!.tenantId,
      userId: session!.sub,
      action: "lead.stage_moved",
      entityType: "lead",
      entityId: id,
      changes: { stageId: stage.id, stageName: stage.name },
    });

    return NextResponse.json({ lead: updated });
  });
}
