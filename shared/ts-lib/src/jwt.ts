import { jwtVerify, type JWTPayload } from "jose";

export type BaseSessionPayload = {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
};

export function getJwtSecret(options?: {
  allowDevFallback?: boolean;
  devFallback?: string;
}): Uint8Array {
  const allowDevFallback = options?.allowDevFallback ?? true;
  const devFallback =
    options?.devFallback ?? "dev-only-jwt-secret-change-me-min-16-chars";
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret === "change-me-to-a-long-random-secret") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    if (!allowDevFallback) {
      throw new Error("JWT_SECRET must be set (min 16 characters)");
    }
    return new TextEncoder().encode(devFallback);
  }

  if (secret.length < 16) {
    throw new Error("JWT_SECRET must be at least 16 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function verifyJwtPayload<T extends BaseSessionPayload>(
  token: string,
  mapPayload: (payload: JWTPayload) => T | null,
  secret?: Uint8Array
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret ?? getJwtSecret());
    return mapPayload(payload);
  } catch {
    return null;
  }
}
