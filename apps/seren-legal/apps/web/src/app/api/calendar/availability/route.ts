import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { getAttorneyAvailability } from "@/lib/calendar-stub";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const { searchParams } = new URL(request.url);
    const attorneyId = searchParams.get("attorneyId");
    const date = searchParams.get("date");

    if (!attorneyId || !date) {
      return NextResponse.json(
        { error: "attorneyId and date query params are required" },
        { status: 400 }
      );
    }

    try {
      const availability = await getAttorneyAvailability(
        session!.tenantId,
        attorneyId,
        date
      );
      return NextResponse.json(availability);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load availability";
      return NextResponse.json({ error: msg }, { status: 404 });
    }
  });
}
