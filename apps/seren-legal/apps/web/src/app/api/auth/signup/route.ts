import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, setAuthCookie, signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/tenant";
import { slugify } from "@/lib/utils";

const schema = z.object({
  firmName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const existing = await prisma.user.findFirst({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    let slug = slugify(body.firmName);
    const slugTaken = await prisma.tenant.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

    const plan = await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { monthlyPrice: "asc" } });

    const passwordHash = await hashPassword(body.password);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.firmName,
          slug,
          planId: plan?.id,
          settings: { timezone: "America/New_York" },
        },
      });

      const pipeline = await tx.pipeline.create({
        data: { tenantId: tenant.id, name: "Default Pipeline", isDefault: true },
      });

      const stageNames = ["New Lead", "Contacted", "Qualified", "Consultation", "Retained", "Lost"];
      const colors = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#22c55e", "#94a3b8"];
      await Promise.all(
        stageNames.map((name, i) =>
          tx.pipelineStage.create({
            data: {
              tenantId: tenant.id,
              pipelineId: pipeline.id,
              name,
              position: i,
              color: colors[i],
              isTerminal: i >= 4,
            },
          })
        )
      );

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: body.email,
          passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
          role: "owner",
        },
      });

      return { tenant, user };
    });

    const token = await signToken({
      userId: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: result.user.role,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    });

    await auditLog({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: "tenant.created",
      entityType: "tenant",
      entityId: result.tenant.id,
    });

    const response = NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug },
    });
    setAuthCookie(response, token);
    return response;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
