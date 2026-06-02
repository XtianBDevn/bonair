import { NextRequest, NextResponse } from "next/server";
import { processDueWorkflowExecutions } from "@/lib/workflow-executor";
import { upsertDailySnapshot } from "@/lib/analytics";
import { prisma } from "@/lib/db";

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workflowResult = await processDueWorkflowExecutions();

  const tenants = await prisma.tenant.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  const snapshots: string[] = [];
  for (const t of tenants) {
    await upsertDailySnapshot(t.id);
    snapshots.push(t.id);
  }

  return NextResponse.json({
    ok: true,
    workflows: workflowResult,
    analyticsSnapshots: snapshots.length,
  });
}
