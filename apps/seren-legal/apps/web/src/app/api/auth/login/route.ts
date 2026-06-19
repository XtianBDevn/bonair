import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setAuthCookie, signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 1 minute." },
      { status: 429 }
    );
  }

  try {
    const body = schema.parse(await request.json());

    // ── Tenant-scoped lookup ──
    // When tenantSlug is provided, only match users in that tenant.
    // When not provided, fall back to findFirst (legacy behavior).
    let user;
    if (body.tenantSlug) {
      user = await prisma.user.findFirst({
        where: {
          email: body.email,
          isActive: true,
          tenant: { slug: body.tenantSlug },
        },
        include: { tenant: true },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { email: body.email, isActive: true },
        include: { tenant: true },
      });
    }

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    });
    setAuthCookie(response, token);
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
