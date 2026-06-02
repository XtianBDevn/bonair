import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tenantWhere } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withAuth(request, async (session) => {
    const { id } = await params;
    const intakeSession = await prisma.intakeSession.findFirst({
      where: { id, ...tenantWhere(session!) },
      include: {
        contact: true,
        lead: { include: { contact: true } },
        form: true,
      },
    });
    if (!intakeSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session: intakeSession });
  });
}
