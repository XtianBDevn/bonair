import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";
import { generateGbpPostDraft } from "@/lib/ai";
import { jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  locationId: z.string().uuid(),
  topic: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireTenantContext();
    const body = schema.parse(await request.json());

    const location = await prisma.businessLocation.findFirst({
      where: { id: body.locationId, tenantId: tenant.id },
    });
    if (!location) return jsonError("Location not found", 404);

    const addr = location.address as { city?: string };
    const { body: draft, jobId } = await generateGbpPostDraft({
      tenantId: tenant.id,
      businessName: location.name,
      topic: body.topic,
      city: addr.city,
    });

    return jsonOk({ body: draft, jobId });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Draft generation failed", 500);
  }
}
