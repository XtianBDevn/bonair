import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { aggregateTenantMetrics, upsertDailySnapshot } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { tenantWhere } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      await upsertDailySnapshot(session!.tenantId);
    }

    const metrics = await aggregateTenantMetrics(session!.tenantId);

    const snapshots = await prisma.analyticsSnapshot.findMany({
      where: tenantWhere(session!),
      orderBy: { snapshotDate: "desc" },
      take: 14,
    });

    return NextResponse.json({ metrics, snapshots });
  });
}
