import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const user = await getCurrentUser(session!);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        attorney: user.attorney,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      },
    });
  });
}
