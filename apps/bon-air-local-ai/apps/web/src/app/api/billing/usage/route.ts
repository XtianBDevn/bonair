import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [events, aiJobs] = await Promise.all([
      prisma.usageEvent.groupBy({
        by: ["kind"],
        where: { tenantId: tenant.id, createdAt: { gte: since } },
        _sum: { quantity: true },
      }),
      prisma.aiJob.count({
        where: {
          tenantId: tenant.id,
          status: "completed",
          finishedAt: { gte: since },
        },
      }),
    ]);

    const limits = (tenant.plan?.limits ?? {}) as Record<string, number>;
    const usage: Record<string, number> = {};
    for (const row of events) {
      usage[row.kind] = Number(row._sum.quantity ?? 0);
    }

    return jsonOk({
      periodStart: since.toISOString(),
      usage,
      aiJobsCompleted: aiJobs,
      limits: {
        aiCredits: limits.aiCredits ?? null,
        geoPages: limits.geoPages ?? null,
        gbpPosts: limits.gbpPosts ?? null,
      },
      plan: tenant.plan?.name ?? null,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to load usage", 500);
  }
}
