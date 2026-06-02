import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { auditLog, tenantWhere } from "@/lib/tenant";
import { getAppUrl } from "@/lib/env";

const schema = z.object({
  leadId: z.string().uuid(),
  platform: z.enum(["google", "avvo", "yelp", "facebook"]).default("google"),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id: parsed.data.leadId, ...tenantWhere(session!) },
      include: { contact: true },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const reviewUrl = `${getAppUrl()}/reviews/stub?lead=${lead.id}&platform=${parsed.data.platform}`;
    const messageSent = `We'd love your feedback! Leave a review: ${reviewUrl}`;

    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        tenantId: session!.tenantId,
        leadId: lead.id,
        contactId: lead.contactId,
        platform: parsed.data.platform,
        status: "sent",
        reviewUrl,
        messageSent,
        sentAt: new Date(),
      },
    });

    await prisma.communication.create({
      data: {
        tenantId: session!.tenantId,
        contactId: lead.contactId,
        leadId: lead.id,
        channel: "email",
        direction: "outbound",
        status: "stub",
        subject: "Review request",
        body: messageSent,
        sentByUserId: session!.sub,
        metadata: { reviewRequestId: reviewRequest.id },
      },
    });

    await auditLog({
      tenantId: session!.tenantId,
      userId: session!.sub,
      action: "review.requested",
      entityType: "review_request",
      entityId: reviewRequest.id,
      changes: { platform: parsed.data.platform },
    });

    return NextResponse.json({ reviewRequest }, { status: 201 });
  });
}
