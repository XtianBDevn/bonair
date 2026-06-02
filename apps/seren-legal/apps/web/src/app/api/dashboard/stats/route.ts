import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tenantWhere } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const where = tenantWhere(session!);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalLeads, newLeads, qualifiedLeads, highUrgency, intakeSessions, communications, retained] =
      await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
        prisma.lead.count({ where: { ...where, status: "qualified" } }),
        prisma.lead.count({ where: { ...where, urgency: { in: ["high", "critical"] } } }),
        prisma.intakeSession.count({ where: { ...where, status: "in_progress" } }),
        prisma.communication.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
        prisma.lead.count({ where: { ...where, status: "retained" } }),
      ]);

    const recentLeads = await prisma.lead.findMany({
      where,
      include: { contact: true, pipelineStage: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const bySource = await prisma.lead.groupBy({
      by: ["source"],
      where,
      _count: true,
    });

    return NextResponse.json({
      stats: {
        totalLeads,
        newLeadsThisWeek: newLeads,
        qualifiedLeads,
        highUrgencyLeads: highUrgency,
        activeIntakeSessions: intakeSessions,
        communicationsThisWeek: communications,
        retainedClients: retained,
        conversionRate: totalLeads > 0 ? Math.round((retained / totalLeads) * 100) : 0,
      },
      recentLeads,
      leadsBySource: bySource.map((s) => ({ source: s.source, count: s._count })),
    });
  });
}
