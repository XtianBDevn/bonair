import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireTenantContext } from "@/lib/tenant";
import { createCheckoutSession, getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  planCode: z.string().min(1),
  interval: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(request: NextRequest) {
  try {
    if (!getStripe()) {
      return jsonError(
        "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs in environment.",
        503
      );
    }

    const { session, tenant } = await requireTenantContext();
    const body = bodySchema.parse(await request.json());

    const plan = await prisma.plan.findFirst({
      where: { code: body.planCode, isActive: true },
    });
    if (!plan) return jsonError("Plan not found", 404);

    const stripePriceId =
      body.interval === "annual"
        ? plan.stripePriceAnnual
        : plan.stripePriceMonthly;
    if (!stripePriceId) {
      return jsonError(
        `Stripe price not configured for ${body.planCode} (${body.interval})`,
        503
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user?.email) return jsonError("User email required", 400);

    const url = await createCheckoutSession({
      tenantId: tenant.id,
      planId: plan.id,
      planCode: plan.code,
      stripePriceId,
      customerEmail: user.email,
      interval: body.interval,
    });

    return jsonOk({ url });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError("Invalid input", 400);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    if (e instanceof Error && e.message === "STRIPE_NOT_CONFIGURED") {
      return jsonError("Stripe not configured", 503);
    }
    console.error("checkout error:", e);
    return jsonError("Checkout failed", 500);
  }
}
