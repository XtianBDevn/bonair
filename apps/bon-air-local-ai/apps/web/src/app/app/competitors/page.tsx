import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Competitors" };

export default async function CompetitorsPage() {
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const snapshots = await prisma.competitorSnapshot.findMany({
    where: { tenantId: tenant.id },
    include: { location: { select: { name: true } } },
    orderBy: [{ keyword: "asc" }, { rankPosition: "asc" }, { capturedAt: "desc" }],
    take: 50,
  });

  const keywords = [...new Set(snapshots.map((s) => s.keyword).filter(Boolean))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Competitor intel</h1>
        <p className="text-slate-600">
          Snapshot comparisons for local pack competitors (demo seed data)
        </p>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <Badge key={kw!} variant="default">
              {kw}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Snapshots ({snapshots.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="text-sm text-slate-500">No competitor snapshots yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Competitor</th>
                    <th className="pb-3 font-medium">Keyword</th>
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Rating</th>
                    <th className="pb-3 font-medium">Reviews</th>
                    <th className="pb-3 font-medium">Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-900">
                        {s.competitorName}
                      </td>
                      <td className="py-3 text-slate-600">{s.keyword ?? "—"}</td>
                      <td className="py-3">
                        {s.rankPosition != null ? `#${s.rankPosition}` : "—"}
                      </td>
                      <td className="py-3 text-slate-600">
                        {s.rating != null ? Number(s.rating).toFixed(1) : "—"}
                      </td>
                      <td className="py-3 text-slate-600">{s.reviewCount ?? "—"}</td>
                      <td className="py-3 text-xs text-slate-500">
                        {format(s.capturedAt, "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
