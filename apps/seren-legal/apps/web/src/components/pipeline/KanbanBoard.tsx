"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { contactName, practiceAreaLabel, urgencyColor } from "@/lib/utils";

type Stage = { id: string; name: string; color: string | null; position: number };
type Lead = {
  id: string;
  score: number;
  urgency: string;
  practiceArea: string;
  contact: { firstName: string | null; lastName: string | null };
  pipelineStageId: string | null;
};

export function KanbanBoard({
  stages,
  leadsByStage: initial,
}: {
  stages: Stage[];
  leadsByStage: Record<string, Lead[]>;
}) {
  const router = useRouter();
  const [leadsByStage, setLeadsByStage] = useState(initial);
  const [moving, setMoving] = useState<string | null>(null);

  async function moveLead(leadId: string, stageId: string) {
    setMoving(leadId);
    try {
      await api(`/api/pipeline/leads/${leadId}/move`, {
        method: "POST",
        body: JSON.stringify({ stageId }),
      });
      setLeadsByStage((prev) => {
        const next = { ...prev };
        let lead: Lead | undefined;
        for (const sid of Object.keys(next)) {
          const idx = next[sid].findIndex((l) => l.id === leadId);
          if (idx >= 0) {
            lead = next[sid][idx];
            next[sid] = next[sid].filter((l) => l.id !== leadId);
            break;
          }
        }
        if (lead) {
          next[stageId] = [...(next[stageId] ?? []), { ...lead, pipelineStageId: stageId }];
        }
        return next;
      });
      router.refresh();
    } finally {
      setMoving(null);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/50"
        >
          <div
            className="flex items-center justify-between rounded-t-xl px-4 py-3"
            style={{ borderTop: `3px solid ${stage.color ?? "#6366f1"}` }}
          >
            <h3 className="text-sm font-semibold text-slate-800">{stage.name}</h3>
            <Badge className="bg-white text-slate-600">
              {(leadsByStage[stage.id] ?? []).length}
            </Badge>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            {(leadsByStage[stage.id] ?? []).map((lead) => (
              <div
                key={lead.id}
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                  {contactName(lead.contact.firstName, lead.contact.lastName)}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{practiceAreaLabel(lead.practiceArea)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={urgencyColor(lead.urgency)}>{lead.urgency}</Badge>
                  <span className="text-xs font-medium text-indigo-600">Score {lead.score}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {stages
                    .filter((s) => s.id !== stage.id)
                    .map((s) => (
                      <Button
                        key={s.id}
                        variant="outline"
                        size="sm"
                        disabled={moving === lead.id}
                        onClick={() => moveLead(lead.id, s.id)}
                        className="text-xs"
                      >
                        → {s.name}
                      </Button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
