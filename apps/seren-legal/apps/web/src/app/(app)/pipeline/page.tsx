import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function PipelinePage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const pipeline = await prisma.pipeline.findFirst({
    where: { ...tenantWhere(session), isDefault: true },
    include: { stages: { orderBy: { position: "asc" } } },
  });

  if (!pipeline) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="mt-2 text-slate-500">No default pipeline configured.</p>
      </div>
    );
  }

  const leads = await prisma.lead.findMany({
    where: { ...tenantWhere(session), pipelineStage: { pipelineId: pipeline.id } },
    include: { contact: true },
    orderBy: { updatedAt: "desc" },
  });

  const leadsByStage: Record<string, typeof leads> = {};
  for (const stage of pipeline.stages) {
    leadsByStage[stage.id] = [];
  }
  for (const lead of leads) {
    const sid = lead.pipelineStageId ?? pipeline.stages[0]?.id;
    if (sid && leadsByStage[sid]) leadsByStage[sid].push(lead);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
        <p className="text-slate-500">
          {pipeline.name} — click arrows on a card to move stages
        </p>
      </div>
      <KanbanBoard stages={pipeline.stages} leadsByStage={leadsByStage} />
    </div>
  );
}
