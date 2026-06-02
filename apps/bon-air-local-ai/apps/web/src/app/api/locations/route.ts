import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { auditLog } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();
    const locations = await prisma.businessLocation.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ locations });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  street: z.string().optional(),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  primaryCategory: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { session, tenant } = await requireTenantContext();
    const body = createSchema.parse(await request.json());

    const location = await prisma.businessLocation.create({
      data: {
        tenantId: tenant.id,
        name: body.name,
        address: {
          street: body.street ?? "",
          city: body.city,
          region: body.region,
          postalCode: body.postalCode ?? "",
          country: "US",
        },
        phone: body.phone,
        website: body.website || null,
        primaryCategory: body.primaryCategory,
      },
    });

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "location.create",
      targetType: "business_location",
      targetId: location.id,
    });

    return jsonOk({ location }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to create location", 500);
  }
}
