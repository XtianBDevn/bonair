import OpenAI from "openai";

const DEFAULT_REQUIRED = ["DATABASE_URL", "JWT_SECRET"] as const;

export type OpenAIMode = "live" | "template";

export function validateServerEnv(
  required: readonly string[] = DEFAULT_REQUIRED
): { ok: true } | { ok: false; missing: string[] } {
  const missing = required.filter((key) => !process.env[key]?.trim());
  return missing.length ? { ok: false, missing: [...missing] } : { ok: true };
}

export function getOpenAIMode(): OpenAIMode {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return "template";
  if (!key.startsWith("sk-")) {
    console.warn(
      "[openai] OPENAI_API_KEY is set but does not look like a valid key (expected sk- prefix)."
    );
  }
  return "live";
}

export function getOpenAIClient(): OpenAI | null {
  if (getOpenAIMode() !== "live") return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY!.trim() });
}

export function getAppUrl(defaultUrl = "http://localhost:3000"): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? defaultUrl;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim()
  );
}
