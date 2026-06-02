import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  const [user, tenant, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub } }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: { plan: true },
    }),
    prisma.membership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: session.tenantId,
          userId: session.sub,
        },
      },
    }),
  ]);

  if (!user || !tenant || !membership) {
    return jsonError("Unauthorized", 401);
  }

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: membership.role,
    },
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan?.name ?? null,
    },
  });
}
