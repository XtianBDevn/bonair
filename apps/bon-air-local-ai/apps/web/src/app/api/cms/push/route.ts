import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";
import { pushToWordPress, verifyCmsWebhookSignature } from "@/lib/cms";

const sessionPushSchema = z.object({
  geoPageId: z.string().uuid(),
});

const webhookPushSchema = z.object({
  tenantId: z.string().uuid(),
  geoPageId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const signature = request.headers.get("x-bonair-signature");
  const webhookSecret = process.env.CMS_WEBHOOK_SECRET?.trim();
  const webhookMode = Boolean(webhookSecret && signature);

  if (webhookMode) {
    if (!verifyCmsWebhookSignature(rawBody, signature)) {
      return jsonError("Invalid CMS webhook signature", 401);
    }
  }

  try {
    let tenantId: string;
    let userId: string | undefined;
    let geoPageId: string;

    if (webhookMode) {
      const parsed = webhookPushSchema.parse(body);
      tenantId = parsed.tenantId;
      geoPageId = parsed.geoPageId;
    } else {
      const { session, tenant } = await requireTenantContext();
      const parsed = sessionPushSchema.parse(body);
      tenantId = tenant.id;
      userId = session.sub;
      geoPageId = parsed.geoPageId;
    }

    const page = await prisma.geoPage.findFirst({
      where: { id: geoPageId, tenantId },
    });
    if (!page) return jsonError("GEO page not found", 404);

    const result = await pushToWordPress(tenantId, {
      geoPageId: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content as Record<string, unknown>,
      publishedUrl: page.publishedUrl ?? undefined,
    });

    if (userId) {
      await auditLog({
        tenantId,
        userId,
        action: "cms.push",
        targetType: "geo_page",
        targetId: page.id,
        metadata: { mode: result.mode, via: webhookMode ? "webhook" : "session" },
      });
    }

    return jsonOk(result, 202);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    console.error("cms push error:", e);
    return jsonError("CMS push failed", 500);
  }
}
