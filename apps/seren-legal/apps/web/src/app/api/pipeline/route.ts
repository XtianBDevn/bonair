import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tenantWhere } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const pipeline = await prisma.pipeline.findFirst({
      where: { ...tenantWhere(session!), isDefault: true },
      include: {
        stages: { orderBy: { position: "asc" } },
      },
    });

    if (!pipeline) {
      return NextResponse.json({ pipeline: null, stages: [], leadsByStage: {} });
    }

    const leads = await prisma.lead.findMany({
      where: { ...tenantWhere(session!), pipelineStage: { pipelineId: pipeline.id } },
      include: { contact: true, pipelineStage: true },
      orderBy: { updatedAt: "desc" },
    });

    const leadsByStage: Record<string, typeof leads> = {};
    for (const stage of pipeline.stages) {
      leadsByStage[stage.id] = [];
    }
    for (const lead of leads) {
      const sid = lead.pipelineStageId ?? pipeline.stages[0]?.id;
      if (sid && leadsByStage[sid]) leadsByStage[sid].push(lead);
      else if (pipeline.stages[0]) leadsByStage[pipeline.stages[0].id]?.push(lead);
    }

    return NextResponse.json({
      pipeline,
      stages: pipeline.stages,
      leadsByStage,
    });
  });
}
