import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/api";
import { createBillingPortalSession, getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    if (!getStripe()) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account" }, { status: 404 });
    }

    try {
      const url = await createBillingPortalSession(subscription.stripeCustomerId);
      return NextResponse.json({ url });
    } catch (e) {
      console.error("portal error:", e);
      return NextResponse.json({ error: "Portal failed" }, { status: 500 });
    }
  });
}
