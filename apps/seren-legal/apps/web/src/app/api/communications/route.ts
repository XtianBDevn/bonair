import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { auditLog, tenantWhere } from "@/lib/tenant";
import { sendSms } from "@/lib/twilio";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const communications = await prisma.communication.findMany({
      where: tenantWhere(session!),
      include: {
        contact: true,
        lead: { include: { contact: true } },
        sentBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ communications });
  });
}

const createSchema = z.object({
  contactId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  channel: z.enum(["sms", "email", "call"]),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
  body: z.string().min(1),
  subject: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    const body = createSchema.parse(await request.json());
    const contact = await prisma.contact.findFirst({
      where: { id: body.contactId, ...tenantWhere(session!) },
    });
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    let twilioSid: string | undefined;
    let status = "sent";

    if (body.channel === "sms" && body.direction === "outbound" && contact.phone) {
      try {
        const sms = await sendSms({ to: contact.phone, body: body.body });
        twilioSid = sms.sid;
        status = sms.mode === "stub" ? "queued_stub" : sms.status;
      } catch {
        status = "failed";
      }
    }

    const communication = await prisma.communication.create({
      data: {
        tenantId: session!.tenantId,
        contactId: body.contactId,
        leadId: body.leadId,
        channel: body.channel,
        direction: body.direction,
        body: body.body,
        subject: body.subject,
        status,
        toNumber: contact.phone ?? undefined,
        twilioSid,
        sentByUserId: session!.sub,
      },
      include: { contact: true, lead: true },
    });

    await auditLog({
      tenantId: session!.tenantId,
      userId: session!.sub,
      action: "communication.created",
      entityType: "communication",
      entityId: communication.id,
    });

    return NextResponse.json({ communication }, { status: 201 });
  });
}
