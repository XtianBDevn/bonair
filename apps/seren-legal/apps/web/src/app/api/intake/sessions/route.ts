import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tenantWhere } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const sessions = await prisma.intakeSession.findMany({
      where: tenantWhere(session!),
      include: {
        contact: true,
        lead: { include: { contact: true } },
        form: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ sessions });
  });
}
