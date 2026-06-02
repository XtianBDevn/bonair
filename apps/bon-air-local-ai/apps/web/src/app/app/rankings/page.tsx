import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Rankings" };

export default async function RankingsPage() {
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const keywords = await prisma.rankKeyword.findMany({
    where: { tenantId: tenant.id, isActive: true },
    include: {
      location: { select: { name: true } },
      snapshots: { orderBy: { capturedAt: "desc" }, take: 14 },
    },
    orderBy: { keyword: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rank tracking</h1>
        <p className="text-slate-600">
          Local pack positions over time (demo data — DataForSEO/SerpApi in production)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Keywords ({keywords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {keywords.length === 0 ? (
              <p className="text-sm text-slate-500">No tracked keywords yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-medium">Keyword</th>
                      <th className="pb-3 font-medium">Location</th>
                      <th className="pb-3 font-medium">Latest</th>
                      <th className="pb-3 font-medium">Local pack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((kw) => {
                      const latest = kw.snapshots[0];
                      return (
                        <tr key={kw.id} className="border-b border-slate-100">
                          <td className="py-3 font-medium text-slate-900">{kw.keyword}</td>
                          <td className="py-3 text-slate-600">
                            {kw.location?.name ?? "—"}
                          </td>
                          <td className="py-3">
                            {latest?.position != null ? (
                              <Badge variant={latest.position <= 3 ? "success" : "default"}>
                                #{latest.position}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 text-slate-600">
                            {latest?.localPack != null ? `#${latest.localPack}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend chart (placeholder)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500"
              role="img"
              aria-label="Ranking trend chart placeholder"
            >
              Chart visualization — connect rank_snapshots API for Recharts
            </div>
            {keywords[0] && (
              <p className="mt-4 text-xs text-slate-500">
                Sample series: {keywords[0].snapshots.length} snapshots for &quot;
                {keywords[0].keyword}&quot;
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
