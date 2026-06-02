import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { summarizeIntake } from "@/lib/ai";
import { widgetLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * Build CORS headers. In production, restrict to tenant's configured origins.
 */
function corsHeaders(tenantOrigins?: string | null): Record<string, string> {
  const origin = tenantOrigins || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  // For OPTIONS, use permissive CORS (we don't have the tenant slug yet)
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const BOT_GREETING =
  "Hello! I'm Seren's intake assistant. Briefly describe your legal matter and we'll connect you with the right attorney.";

const BOT_FOLLOWUPS = [
  "Thank you. Can you tell me when this occurred?",
  "I understand. Have you spoken with another attorney about this?",
  "We'll have someone from the firm review your message shortly. What is the best phone number to reach you?",
];

const bodySchema = z.object({
  firmSlug: z.string().min(1),
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  // ── Rate limit by IP ──
  const ip = getClientIp(request);
  const { success: allowed } = widgetLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: corsHeaders() }
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
    const tenant = await getTenantBySlug(body.firmSlug);
    if (!tenant) {
      return NextResponse.json(
        { error: "Firm not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Use tenant-configured allowed origins if available
    const settings = tenant.settings as Record<string, unknown> | null;
    const allowedOrigins = (settings?.widgetOrigins as string) ?? null;
    const headers = corsHeaders(allowedOrigins);

    const intakeForm = await prisma.intakeForm.findFirst({
      where: { tenantId: tenant.id, isActive: true },
    });

    let session = body.sessionId
      ? await prisma.intakeSession.findFirst({
          where: { id: body.sessionId, tenantId: tenant.id, channel: "chatbot" },
        })
      : null;

    if (!session) {
      session = await prisma.intakeSession.create({
        data: {
          tenantId: tenant.id,
          formId: intakeForm?.id,
          channel: "chatbot",
          status: "in_progress",
          transcript: [{ role: "bot", content: BOT_GREETING, ts: new Date().toISOString() }],
          formData: { step: 0 },
        },
      });
    }

    const transcript = (session.transcript as Array<{ role: string; content: string; ts?: string }>) ?? [];
    transcript.push({
      role: "user",
      content: body.message,
      ts: new Date().toISOString(),
    });

    const formData = (session.formData as Record<string, unknown>) ?? {};
    const step = Number(formData.step ?? 0) + 1;
    formData.step = step;
    if (body.contactPhone) formData.contactPhone = body.contactPhone;
    if (body.contactEmail) formData.contactEmail = body.contactEmail;

    let reply: string;
    let complete = false;
    let leadId: string | undefined;

    if (step <= BOT_FOLLOWUPS.length) {
      reply = BOT_FOLLOWUPS[step - 1];
      transcript.push({ role: "bot", content: reply, ts: new Date().toISOString() });

      await prisma.intakeSession.update({
        where: { id: session.id },
        data: { transcript: transcript as object, formData: formData as object },
      });
    } else {
      complete = true;
      const summary = await summarizeIntake(
        {
          transcript,
          formData,
          firmName: tenant.name,
        },
        { tenantId: tenant.id }
      );

      const contact = await prisma.contact.create({
        data: {
          tenantId: tenant.id,
          firstName: "Intake",
          lastName: "Visitor",
          email: body.contactEmail ?? undefined,
          phone: body.contactPhone ?? undefined,
          metadata: { source: "chatbot", sessionId: session.id },
        },
      });

      const pipeline = await prisma.pipeline.findFirst({
        where: { tenantId: tenant.id, isDefault: true },
        include: { stages: { orderBy: { position: "asc" }, take: 1 } },
      });

      const lead = await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          contactId: contact.id,
          source: "chatbot",
          sourceDetail: `widget:${body.firmSlug}`,
          practiceArea: summary.practiceArea,
          status: "new",
          score: summary.score,
          urgency: summary.urgency,
          caseSummary: summary.summary,
          pipelineStageId: pipeline?.stages[0]?.id,
        },
      });
      leadId = lead.id;

      reply = `Thank you! ${tenant.name} will follow up soon. Your reference is ${lead.id.slice(0, 8).toUpperCase()}.`;
      transcript.push({ role: "bot", content: reply, ts: new Date().toISOString() });

      await prisma.intakeSession.update({
        where: { id: session.id },
        data: {
          transcript: transcript as object,
          formData: formData as object,
          status: "completed",
          completedAt: new Date(),
          leadId: lead.id,
          contactId: contact.id,
          aiSummary: summary.summary,
          aiUrgency: summary.urgency,
          aiPracticeArea: summary.practiceArea,
          aiScore: summary.score,
          aiEntities: (summary.entities ?? {}) as object,
        },
      });
    }

    return NextResponse.json(
      { sessionId: session.id, reply, complete, leadId },
      { headers }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400, headers: corsHeaders() }
      );
    }
    console.error("widget intake error:", e);
    return NextResponse.json(
      { error: "Intake failed" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
