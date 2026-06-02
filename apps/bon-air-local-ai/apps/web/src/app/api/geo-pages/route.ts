import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { auditLog } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireTenantContext();
    const status = request.nextUrl.searchParams.get("status");

    const pages = await prisma.geoPage.findMany({
      where: {
        tenantId: tenant.id,
        ...(status ? { status } : {}),
      },
      include: { location: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk({ pages });
  } catch {
    return jsonError("Unauthorized", 401);
  }
}

const createSchema = z.object({
  locationId: z.string().uuid().optional(),
  pageType: z.string().default("city_service"),
  slug: z.string().optional(),
  targetCity: z.string().min(1),
  targetRegion: z.string().min(1),
  title: z.string().min(1),
  metaDescription: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export async function POST(request: NextRequest) {
  try {
    const { session, tenant } = await requireTenantContext();
    const body = createSchema.parse(await request.json());

    const slug =
      body.slug ??
      slugify(`${body.targetCity}-${body.targetRegion}-${body.pageType}`);

    const existing = await prisma.geoPage.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
    });
    if (existing) return jsonError("Slug already exists", 409);

    const page = await prisma.geoPage.create({
      data: {
        tenantId: tenant.id,
        locationId: body.locationId,
        pageType: body.pageType,
        slug,
        targetCity: body.targetCity,
        targetRegion: body.targetRegion,
        title: body.title,
        metaDescription: body.metaDescription,
        content: body.content as Prisma.InputJsonValue,
        status: body.status,
        createdById: session.sub,
        publishedAt: body.status === "published" ? new Date() : null,
      },
    });

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "geo_page.create",
      targetType: "geo_page",
      targetId: page.id,
    });

    return jsonOk({ page }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to create page", 500);
  }
}
