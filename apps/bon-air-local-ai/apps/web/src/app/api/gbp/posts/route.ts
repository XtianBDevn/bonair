import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { auditLog } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();
    const posts = await prisma.gbpPost.findMany({
      where: { tenantId: tenant.id },
      include: { location: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ posts });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}

const createSchema = z.object({
  locationId: z.string().uuid(),
  topic: z.string().min(1),
  body: z.string().min(1),
  ctaType: z.string().optional(),
  ctaUrl: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
});

export async function POST(request: NextRequest) {
  try {
    const { session, tenant } = await requireTenantContext();
    const body = createSchema.parse(await request.json());

    const location = await prisma.businessLocation.findFirst({
      where: { id: body.locationId, tenantId: tenant.id },
    });
    if (!location) return jsonError("Location not found", 404);

    const post = await prisma.gbpPost.create({
      data: {
        tenantId: tenant.id,
        locationId: body.locationId,
        topic: body.topic,
        body: body.body,
        ctaType: body.ctaType,
        ctaUrl: body.ctaUrl,
        scheduledFor: body.scheduledFor
          ? new Date(body.scheduledFor)
          : undefined,
        status: body.status,
      },
    });

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "gbp_post.create",
      targetType: "gbp_post",
      targetId: post.id,
    });

    return jsonOk({ post }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to create post", 500);
  }
}
