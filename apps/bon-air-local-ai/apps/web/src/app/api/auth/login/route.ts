import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  auditLog,
  buildSessionForUser,
  setAuthCookies,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user?.passwordHash || !user.isActive) {
      return jsonError("Invalid email or password", 401);
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return jsonError("Invalid email or password", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await buildSessionForUser(user.id);
    if (!session) return jsonError("No workspace found for user", 403);

    await setAuthCookies(session);
    await auditLog({
      tenantId: session.tenantId,
      userId: user.id,
      action: "auth.login",
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
    });

    return jsonOk({
      user: { id: user.id, email: user.email, name: user.name },
      tenant: tenant
        ? { id: tenant.id, slug: tenant.slug, name: tenant.name }
        : null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError("Invalid input", 400);
    }
    console.error(e);
    return jsonError("Login failed", 500);
  }
}
