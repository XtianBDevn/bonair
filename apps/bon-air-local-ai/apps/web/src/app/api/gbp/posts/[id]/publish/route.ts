import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";
import { publishGbpPost } from "@/lib/gbp-publish";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { session, tenant } = await requireTenantContext();
    const { id } = await context.params;

    const result = await publishGbpPost(id, tenant.id);

    await auditLog({
      tenantId: tenant.id,
      userId: session.sub,
      action: "gbp_post.publish",
      targetType: "gbp_post",
      targetId: id,
      metadata: { mode: result.mode, gbpPostId: result.gbpPostId },
    });

    const post = await prisma.gbpPost.findUnique({ where: { id } });
    return jsonOk({ post, publish: result });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    if (e instanceof Error && e.message === "POST_NOT_FOUND") {
      return jsonError("Post not found", 404);
    }
    if (e instanceof Error && e.message === "ALREADY_PUBLISHED") {
      return jsonError("Post already published", 409);
    }
    console.error("gbp publish error:", e);
    return jsonError("Publish failed", 500);
  }
}
