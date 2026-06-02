import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/api";
import { createCheckoutSession, getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  planId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    if (!getStripe()) {
      return NextResponse.json(
        { error: "Stripe not configured. Set STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const body = bodySchema.parse(await request.json());

    const plan =
      body.planId != null
        ? await prisma.plan.findFirst({ where: { id: body.planId, isActive: true } })
        : await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { monthlyPrice: "asc" } });

    if (!plan?.stripePriceId) {
      return NextResponse.json({ error: "Plan not available" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user?.email) {
      return NextResponse.json({ error: "User email required" }, { status: 400 });
    }

    try {
      const url = await createCheckoutSession({
        tenantId: session.tenantId,
        planId: plan.id,
        stripePriceId: plan.stripePriceId,
        customerEmail: user.email,
      });
      return NextResponse.json({ url });
    } catch (e) {
      console.error("checkout error:", e);
      return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
  });
}
