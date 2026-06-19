import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/tenant";
import { verifyWebhookSignature } from "@/lib/webhook-auth";
import { webhookLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * Zapier webhook — accepts generic automation payloads with HMAC verification.
 * Set ZAPIER_WEBHOOK_SECRET in env to enable signature checks.
 */
export async function POST(request: NextRequest) {
  // ── Rate limit ──
  const ip = getClientIp(request);
  const { success: allowed } = webhookLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  // ── HMAC signature verification ──
  const verification = await verifyWebhookSignature(request, "zapier");
  if (!verification.valid) {
    console.warn("[zapier-webhook] Rejected:", verification.reason);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(verification.rawBody || "{}");
  const action = String((payload as { action?: string }).action ?? "trigger");

  // ── Tenant lookup from payload (not raw header) ──
  const tenantId =
    (payload as { tenantId?: string }).tenantId ??
    request.headers.get("x-seren-tenant-id");

  if (tenantId) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, status: "active" },
    });
    if (tenant) {
      await auditLog({
        tenantId,
        action: "webhook.zapier",
        entityType: "integration",
        entityId: tenantId,
        changes: { action, payload },
      });
    }
  }

  console.info("[zapier-webhook]", { action, tenantId: tenantId ?? "none" });

  return NextResponse.json({
    received: true,
    provider: "zapier",
    action,
  });
}
