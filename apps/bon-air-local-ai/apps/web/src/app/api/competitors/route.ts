import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();

    const snapshots = await prisma.competitorSnapshot.findMany({
      where: { tenantId: tenant.id },
      include: { location: { select: { id: true, name: true } } },
      orderBy: [{ capturedAt: "desc" }, { competitorName: "asc" }],
      take: 100,
    });

    const byKeyword = new Map<string, typeof snapshots>();
    for (const row of snapshots) {
      const key = row.keyword ?? "_general";
      const list = byKeyword.get(key) ?? [];
      list.push(row);
      byKeyword.set(key, list);
    }

    return jsonOk({
      snapshots,
      groupedByKeyword: Object.fromEntries(byKeyword),
    });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
