import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api";
import {
  executeWorkflowStep,
  startWorkflowExecution,
} from "@/lib/workflow-executor";
import { prisma } from "@/lib/db";
import { tenantWhere } from "@/lib/tenant";

const schema = z.object({
  workflowId: z.string().uuid(),
  leadId: z.string().uuid(),
  executionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { workflowId, leadId, executionId } = parsed.data;

    const workflow = await prisma.automationWorkflow.findFirst({
      where: { id: workflowId, ...tenantWhere(session!) },
    });
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    try {
      let execId = executionId;
      if (!execId) {
        const started = await startWorkflowExecution({
          tenantId: session!.tenantId,
          workflowId,
          leadId,
        });
        execId = started.executionId;
      } else {
        const existing = await prisma.workflowExecution.findFirst({
          where: { id: executionId, ...tenantWhere(session!) },
        });
        if (!existing) {
          return NextResponse.json({ error: "Execution not found" }, { status: 404 });
        }
      }

      const result = await executeWorkflowStep(execId);
      return NextResponse.json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Workflow execution failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  });
}
