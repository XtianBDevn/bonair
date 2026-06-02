import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { verifyCronSecret } from "@/lib/cron";
import { processDueGbpPosts } from "@/lib/gbp-scheduled";

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await processDueGbpPosts();
    return jsonOk({
      ok: true,
      ranAt: new Date().toISOString(),
      ...result,
    });
  } catch (e) {
    console.error("gbp-scheduled cron error:", e);
    return jsonError("Cron job failed", 500);
  }
}
