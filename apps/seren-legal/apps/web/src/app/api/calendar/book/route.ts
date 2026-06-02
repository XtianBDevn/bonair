import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api";
import { bookConsultation } from "@/lib/calendar-stub";
import { auditLog } from "@/lib/tenant";

const schema = z.object({
  leadId: z.string().uuid(),
  attorneyId: z.string().uuid(),
  slotStart: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    try {
      const appointment = await bookConsultation({
        tenantId: session!.tenantId,
        ...parsed.data,
      });

      await auditLog({
        tenantId: session!.tenantId,
        userId: session!.sub,
        action: "appointment.booked",
        entityType: "appointment",
        entityId: appointment.id,
        changes: { slotStart: parsed.data.slotStart },
      });

      return NextResponse.json({ appointment }, { status: 201 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Booking failed";
      const status = msg.includes("available") ? 409 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  });
}
