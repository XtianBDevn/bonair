import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { auditLog } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  primaryCategory: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, tenant } = await requireTenantContext();
    const existing = await prisma.businessLocation.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!existing) return jsonError("Not found", 404);

    const body = patchSchema.parse(await request.json());
    const addr = existing.address as Record<string, string>;

    const location = await prisma.businessLocation.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        website: body.website,
        primaryCategory: body.primaryCategory,
        address: {
          street: body.street ?? addr.street,
          city: body.city ?? addr.city,
          region: body.region ?? addr.region,
          postalCode: body.postalCode ?? addr.postalCode,
          country: addr.country ?? "US",
        },
      },
    });

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "location.update",
      targetType: "business_location",
      targetId: id,
    });

    return jsonOk({ location });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Update failed", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, tenant } = await requireTenantContext();
    const existing = await prisma.businessLocation.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!existing) return jsonError("Not found", 404);

    await prisma.businessLocation.delete({ where: { id } });

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "location.delete",
      targetType: "business_location",
      targetId: id,
    });

    return jsonOk({ ok: true });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}
