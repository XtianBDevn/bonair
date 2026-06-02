import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();

    const keywords = await prisma.rankKeyword.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: {
        location: { select: { id: true, name: true } },
        snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 30,
        },
      },
      orderBy: { keyword: "asc" },
    });

    const series = keywords.map((kw) => ({
      keywordId: kw.id,
      keyword: kw.keyword,
      location: kw.location,
      latest: kw.snapshots[0] ?? null,
      history: kw.snapshots.map((s) => ({
        capturedAt: s.capturedAt.toISOString(),
        position: s.position,
        localPack: s.localPack,
        source: s.source,
      })),
    }));

    return jsonOk({ keywords, series });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
