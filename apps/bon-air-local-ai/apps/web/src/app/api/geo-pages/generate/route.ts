import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { auditLog } from "@/lib/auth";
import {
  generateGeoPageContent,
  wordCountFromContent,
  type GeoPageContent,
} from "@/lib/ai";
import { jsonError, jsonOk } from "@/lib/api";
import { slugify } from "@/lib/utils";

const schema = z.object({
  locationId: z.string().uuid(),
  pageType: z.string().default("city_service"),
  targetCity: z.string().min(1),
  targetRegion: z.string().min(1),
  service: z.string().optional(),
  save: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const { session, tenant } = await requireTenantContext();
    const body = schema.parse(await request.json());

    const location = await prisma.businessLocation.findFirst({
      where: { id: body.locationId, tenantId: tenant.id },
    });
    if (!location) return jsonError("Location not found", 404);

    const { content, jobId, provider } = await generateGeoPageContent(
      tenant.id,
      {
        businessName: location.name,
        service: body.service,
        city: body.targetCity,
        region: body.targetRegion,
        pageType: body.pageType,
        primaryCategory: location.primaryCategory ?? undefined,
      }
    );

    const typed = content as GeoPageContent;
    const wordCount = wordCountFromContent(typed);
    const slug = slugify(
      `${body.service ?? location.primaryCategory ?? "service"}-${body.targetCity}-${body.targetRegion}`
    );
    const title = `${body.service ?? location.primaryCategory ?? "Services"} in ${body.targetCity}, ${body.targetRegion} | ${location.name}`;
    const metaDescription = typed.hero.subheadline.slice(0, 160);

    if (!body.save) {
      return jsonOk({ content, jobId, provider, slug, title, metaDescription });
    }

    let finalSlug = slug;
    let n = 1;
    while (
      await prisma.geoPage.findUnique({
        where: { tenantId_slug: { tenantId: tenant.id, slug: finalSlug } },
      })
    ) {
      finalSlug = `${slug}-${n++}`;
    }

    const page = await prisma.geoPage.create({
      data: {
        tenantId: tenant.id,
        locationId: location.id,
        pageType: body.pageType,
        slug: finalSlug,
        targetCity: body.targetCity,
        targetRegion: body.targetRegion,
        title,
        metaDescription,
        content: typed as object,
        status: "draft",
        wordCount,
        createdById: session.sub,
      },
    });

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "geo_page.generate",
      targetType: "geo_page",
      targetId: page.id,
      metadata: { jobId, provider },
    });

    return jsonOk({ page, content, jobId, provider }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    console.error(e);
    return jsonError("Generation failed", 500);
  }
}
