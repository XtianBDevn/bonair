import { clearAuthCookies, getSession, auditLog } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

export async function POST() {
  const session = await getSession();
  if (session) {
    await auditLog({
      tenantId: session.tenantId,
      userId: session.sub,
      action: "auth.logout",
    });
  }
  await clearAuthCookies();
  return jsonOk({ ok: true });
}
