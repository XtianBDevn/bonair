/**
 * In-memory sliding-window rate limiter.
 *
 * Good enough for single-instance deploys. For multi-instance / serverless,
 * swap this out for @upstash/ratelimit backed by Redis.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, limit: 5 });
 *   const { success } = limiter.check(ip);
 */

interface RateLimitConfig {
  /** Window size in milliseconds (default: 60 000 = 1 min) */
  interval?: number;
  /** Max requests per window (default: 5) */
  limit?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms when window resets
}

interface Entry {
  count: number;
  resetAt: number;
}

export function rateLimit(config: RateLimitConfig = {}) {
  const interval = config.interval ?? 60_000;
  const limit = config.limit ?? 5;
  const store = new Map<string, Entry>();

  // Evict expired entries every 60s to prevent memory leak
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }, 60_000);
  // Don't block process exit
  if (cleanup.unref) cleanup.unref();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      let entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + interval };
        store.set(key, entry);
      }

      entry.count++;
      const success = entry.count <= limit;

      return {
        success,
        remaining: Math.max(0, limit - entry.count),
        reset: entry.resetAt,
      };
    },
  };
}

/**
 * Pre-configured limiters for common use cases.
 * Import where needed — the instances are module-level singletons.
 */

/** Auth endpoints: 5 attempts per 60 seconds per IP */
export const authLimiter = rateLimit({ interval: 60_000, limit: 5 });

/** Signup: 3 per 10 minutes per IP */
export const signupLimiter = rateLimit({ interval: 600_000, limit: 3 });

/** Public widget intake: 10 per 60 seconds per IP */
export const widgetLimiter = rateLimit({ interval: 60_000, limit: 10 });

/** Webhook endpoints: 60 per minute per IP */
export const webhookLimiter = rateLimit({ interval: 60_000, limit: 60 });

/**
 * Extract client IP from a Request (works on Vercel + standard proxies).
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
