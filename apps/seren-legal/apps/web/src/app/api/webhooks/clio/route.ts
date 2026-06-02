import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/tenant";

/**
 * Clio webhook stub — accepts matter/contact events and logs for future sync.
 */
export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const eventType = String(
    (payload as { event?: string }).event ??
      (payload as { type?: string }).type ??
      "unknown"
  );

  const tenantId = request.headers.get("x-seren-tenant-id");
  if (tenantId) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, status: "active" },
    });
    if (tenant) {
      await auditLog({
        tenantId,
        action: "webhook.clio",
        entityType: "integration",
        entityId: tenantId,
        changes: { eventType, payload },
      });
    }
  }

  console.info("[clio-webhook-stub]", { eventType, tenantId: tenantId ?? "none" });

  return NextResponse.json({
    received: true,
    provider: "clio",
    eventType,
    mode: "stub",
  });
}
