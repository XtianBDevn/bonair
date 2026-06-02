import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "bonair_access";
const REFRESH_COOKIE = "bonair_refresh";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;

  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.sub && payload.tenantId) return true;
    } catch {
      continue;
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const authed = await hasValidSession(request);
  if (!authed) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
