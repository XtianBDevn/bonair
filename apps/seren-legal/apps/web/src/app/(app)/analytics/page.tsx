import type { LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import {
  BarChart3,
  MessageSquare,
  Target,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionFromCookies } from "@/lib/auth";
import { aggregateTenantMetrics } from "@/lib/analytics";
import { practiceAreaLabel } from "@/lib/utils";

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`rounded-lg bg-slate-100 p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="font-medium text-slate-900">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const metrics = await aggregateTenantMetrics(session.tenantId);
  const maxSource = Math.max(...Object.values(metrics.sourceBreakdown), 1);
  const maxPractice = Math.max(...Object.values(metrics.practiceAreaBreakdown), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500">
          Aggregated from leads, appointments, and communications
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total leads" value={metrics.leadsTotal} icon={Users} color="text-indigo-600" />
        <MetricCard label="Qualified" value={metrics.leadsQualified} icon={Target} color="text-emerald-600" />
        <MetricCard label="New (7d)" value={metrics.leadsNewWeek} icon={TrendingUp} color="text-amber-600" />
        <MetricCard label="Conversion %" value={`${metrics.conversionRate}%`} icon={BarChart3} color="text-violet-600" />
        <MetricCard label="Consultations" value={metrics.consultationsBooked} icon={Calendar} color="text-teal-600" />
        <MetricCard label="Comms (7d)" value={metrics.communicationsWeek} icon={MessageSquare} color="text-sky-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.sourceBreakdown).length === 0 ? (
              <p className="text-sm text-slate-500">No lead data yet.</p>
            ) : (
              Object.entries(metrics.sourceBreakdown).map(([source, count]) => (
                <BreakdownBar
                  key={source}
                  label={source.replace(/_/g, " ")}
                  count={count}
                  max={maxSource}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.practiceAreaBreakdown).map(([area, count]) => (
              <BreakdownBar
                key={area}
                label={practiceAreaLabel(area)}
                count={count}
                max={maxPractice}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline stages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.pipelineBreakdown).map(([stage, count]) => {
              const max = Math.max(...Object.values(metrics.pipelineBreakdown), 1);
              return (
                <BreakdownBar key={stage} label={stage} count={count} max={max} />
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Urgency distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(metrics.urgencyBreakdown).map(([urgency, count]) => (
                <div
                  key={urgency}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-center"
                >
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs capitalize text-slate-500">{urgency}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Avg lead score: <span className="font-semibold text-slate-800">{metrics.avgLeadScore}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
