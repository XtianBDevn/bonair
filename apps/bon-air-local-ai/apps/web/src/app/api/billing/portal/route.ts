import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";
import { createBillingPortalSession, getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    if (!getStripe()) return jsonError("Stripe not configured", 503);

    const { tenant } = await requireTenantContext();
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription?.stripeCustomerId) {
      return jsonError("No billing account found. Subscribe first.", 404);
    }

    const url = await createBillingPortalSession(subscription.stripeCustomerId);
    return jsonOk({ url });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    console.error("portal error:", e);
    return jsonError("Portal failed", 500);
  }
}
