/**
 * HMAC webhook signature verification for external integrations.
 *
 * Each integration gets its own secret in env vars:
 *   CLIO_WEBHOOK_SECRET, ZAPIER_WEBHOOK_SECRET
 *
 * The integration must send a signature header:
 *   x-webhook-signature: sha256=<hex-digest>
 *
 * The digest is HMAC-SHA256(secret, rawBody).
 */

import { createHmac, timingSafeEqual } from "crypto";

export type WebhookProvider = "clio" | "zapier";

const SECRET_MAP: Record<WebhookProvider, string> = {
  clio: "CLIO_WEBHOOK_SECRET",
  zapier: "ZAPIER_WEBHOOK_SECRET",
};

const SIGNATURE_HEADER = "x-webhook-signature";

/**
 * Verify the HMAC signature on an incoming webhook request.
 *
 * @returns `{ valid: true, tenantId }` if the signature checks out,
 *          `{ valid: false, reason }` otherwise.
 */
export async function verifyWebhookSignature(
  request: Request,
  provider: WebhookProvider
): Promise<
  | { valid: true; rawBody: string }
  | { valid: false; reason: string }
> {
  const envKey = SECRET_MAP[provider];
  const secret = process.env[envKey]?.trim();

  if (!secret) {
    // In development without a secret configured, allow with warning
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[webhook-auth] ${envKey} not set — allowing in dev mode`
      );
      const rawBody = await request.text();
      return { valid: true, rawBody };
    }
    return { valid: false, reason: `${envKey} not configured` };
  }

  const signature = request.headers.get(SIGNATURE_HEADER);
  if (!signature) {
    return { valid: false, reason: "Missing signature header" };
  }

  const rawBody = await request.text();

  // Support "sha256=<hex>" format
  const parts = signature.split("=");
  const algo = parts[0] ?? "sha256";
  const provided = parts.slice(1).join("=");
  if (!provided) {
    return { valid: false, reason: "Malformed signature" };
  }

  const expected = createHmac(algo === "sha256" ? "sha256" : "sha256", secret)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: "Invalid signature" };
  }

  return { valid: true, rawBody };
}
