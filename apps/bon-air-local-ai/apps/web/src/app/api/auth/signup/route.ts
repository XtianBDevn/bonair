import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  auditLog,
  buildSessionForUser,
  hashPassword,
  setAuthCookies,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { slugify } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  companyName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      return jsonError("Email already registered", 409);
    }

    const plan = await prisma.plan.findFirst({
      where: { code: "starter", isActive: true },
    });

    const slugBase = slugify(body.companyName);
    let slug = slugBase;
    let n = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${n++}`;
    }

    const passwordHash = await hashPassword(body.password);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: body.companyName,
          planId: plan?.id,
          settings: {},
          brand: {},
        },
      });

      const user = await tx.user.create({
        data: {
          email: body.email.toLowerCase(),
          passwordHash,
          name: body.name,
        },
      });

      await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "owner",
        },
      });

      return { tenant, user };
    });

    const session = await buildSessionForUser(result.user.id, result.tenant.id);
    if (!session) return jsonError("Failed to create session", 500);

    await setAuthCookies(session);
    await auditLog({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: "auth.signup",
    });

    return jsonOk({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      tenant: { id: result.tenant.id, slug: result.tenant.slug, name: result.tenant.name },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(e.issues[0]?.message ?? "Invalid input", 400);
    }
    console.error(e);
    return jsonError("Signup failed", 500);
  }
}
