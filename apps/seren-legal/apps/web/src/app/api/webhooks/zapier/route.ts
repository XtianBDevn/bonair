import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/tenant";

/**
 * Zapier webhook stub — accepts generic automation payloads.
 */
export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const action = String((payload as { action?: string }).action ?? "trigger");

  const tenantId = request.headers.get("x-seren-tenant-id");
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

  console.info("[zapier-webhook-stub]", { action, tenantId: tenantId ?? "none" });

  return NextResponse.json({
    received: true,
    provider: "zapier",
    action,
    mode: "stub",
  });
}
