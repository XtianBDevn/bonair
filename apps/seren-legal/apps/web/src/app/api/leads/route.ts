import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { auditLog, tenantWhere } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const practiceArea = searchParams.get("practiceArea");

    const leads = await prisma.lead.findMany({
      where: {
        ...tenantWhere(session!),
        ...(status ? { status } : {}),
        ...(practiceArea ? { practiceArea } : {}),
      },
      include: {
        contact: true,
        pipelineStage: true,
        assignedAttorney: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads });
  });
}

const createSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().default("manual"),
  practiceArea: z.string(),
  caseTypeDetail: z.string().optional(),
  caseSummary: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      const body = createSchema.parse(await request.json());
      const tenantId = session!.tenantId;

      const defaultStage = await prisma.pipelineStage.findFirst({
        where: { tenantId, pipeline: { isDefault: true } },
        orderBy: { position: "asc" },
      });

      const contact = await prisma.contact.create({
        data: {
          tenantId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          phoneNormalized: body.phone,
        },
      });

      const lead = await prisma.lead.create({
        data: {
          tenantId,
          contactId: contact.id,
          source: body.source,
          practiceArea: body.practiceArea,
          caseTypeDetail: body.caseTypeDetail,
          caseSummary: body.caseSummary,
          pipelineStageId: defaultStage?.id,
          status: "new",
        },
        include: { contact: true, pipelineStage: true },
      });

      await auditLog({
        tenantId,
        userId: session!.sub,
        action: "lead.created",
        entityType: "lead",
        entityId: lead.id,
      });

      return NextResponse.json({ lead }, { status: 201 });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: e.flatten() }, { status: 400 });
      }
      throw e;
    }
  });
}
