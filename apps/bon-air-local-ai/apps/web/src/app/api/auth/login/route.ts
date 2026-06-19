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
import { authLimiter, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  // ── Rate limit ──
  const ip = getClientIp(request);
  const { success: allowed, remaining } = authLimiter.check(ip);
  if (!allowed) {
    return jsonError("Too many login attempts. Try again in 1 minute.", 429);
  }

  try {
    const body = schema.parse(await request.json());

    // ── Tenant-scoped lookup when slug is provided ──
    let user;
    if (body.tenantSlug) {
      const membership = await prisma.membership.findFirst({
        where: {
          tenant: { slug: body.tenantSlug },
          user: { email: body.email.toLowerCase(), isActive: true },
        },
        include: { user: true },
      });
      user = membership?.user ?? null;
    } else {
      user = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      });
    }

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

    const response = jsonOk({
      user: { id: user.id, email: user.email, name: user.name },
      tenant: tenant
        ? { id: tenant.id, slug: tenant.slug, name: tenant.name }
        : null,
    });
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError("Invalid input", 400);
    }
    console.error(e);
    return jsonError("Login failed", 500);
  }
}
