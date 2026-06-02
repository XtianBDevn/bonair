import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";
import { getCitationHealthForTenant } from "@/lib/citations";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();

    const [summary, listings] = await Promise.all([
      getCitationHealthForTenant(tenant.id),
      prisma.citationListing.findMany({
        where: { tenantId: tenant.id },
        include: { location: { select: { name: true } } },
        orderBy: [{ status: "asc" }, { directory: "asc" }],
      }),
    ]);

    return jsonOk({ summary, listings });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
