import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();

    const [
      locationCount,
      geoPageCount,
      geoPublished,
      gbpPostCount,
      gbpScheduled,
      recentJobs,
      usageSum,
    ] = await Promise.all([
      prisma.businessLocation.count({ where: { tenantId: tenant.id } }),
      prisma.geoPage.count({ where: { tenantId: tenant.id } }),
      prisma.geoPage.count({
        where: { tenantId: tenant.id, status: "published" },
      }),
      prisma.gbpPost.count({ where: { tenantId: tenant.id } }),
      prisma.gbpPost.count({
        where: { tenantId: tenant.id, status: "scheduled" },
      }),
      prisma.aiJob.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          kind: true,
          status: true,
          provider: true,
          createdAt: true,
        },
      }),
      prisma.usageEvent.aggregate({
        where: { tenantId: tenant.id, kind: "ai_geo_generate" },
        _sum: { quantity: true },
      }),
    ]);

    return jsonOk({
      locations: locationCount,
      geoPages: { total: geoPageCount, published: geoPublished },
      gbpPosts: { total: gbpPostCount, scheduled: gbpScheduled },
      aiGenerations: Number(usageSum._sum.quantity ?? 0),
      recentAiJobs: recentJobs,
    });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
