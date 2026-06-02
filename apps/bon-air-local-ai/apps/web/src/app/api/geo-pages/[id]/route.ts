import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { auditLog } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenant } = await requireTenantContext();

    const page = await prisma.geoPage.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        location: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });

    if (!page) return jsonError("Not found", 404);
    return jsonOk({ page });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}

const patchSchema = z.object({
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  slug: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, tenant } = await requireTenantContext();
    const existing = await prisma.geoPage.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!existing) return jsonError("Not found", 404);

    const body = patchSchema.parse(await request.json());

    if (body.slug && body.slug !== existing.slug) {
      const clash = await prisma.geoPage.findUnique({
        where: { tenantId_slug: { tenantId: tenant.id, slug: body.slug } },
      });
      if (clash) return jsonError("Slug already in use", 409);
    }

    const page = await prisma.geoPage.update({
      where: { id },
      data: {
        title: body.title,
        metaDescription: body.metaDescription,
        status: body.status,
        content: body.content as Prisma.InputJsonValue | undefined,
        slug: body.slug,
        publishedAt:
          body.status === "published" && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      },
    });

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "geo_page.update",
      targetType: "geo_page",
      targetId: id,
    });

    return jsonOk({ page });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Update failed", 500);
  }
}
