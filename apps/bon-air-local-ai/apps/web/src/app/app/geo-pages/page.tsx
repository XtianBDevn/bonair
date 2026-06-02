import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "GEO Pages" };

export default async function GeoPagesListPage() {
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const pages = await prisma.geoPage.findMany({
    where: { tenantId: tenant.id },
    include: { location: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GEO Pages</h1>
          <p className="text-slate-600">
            Programmatic local landing pages for cities and neighborhoods
          </p>
        </div>
        <Link href="/app/geo-pages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New page
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All pages ({pages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-sm text-slate-500">
              No pages yet.{" "}
              <Link href="/app/geo-pages/new" className="text-brand-700 hover:underline">
                Generate your first GEO page
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Location</th>
                    <th className="pb-3 font-medium">Target</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-900">{p.title}</td>
                      <td className="py-3 text-slate-600">
                        {p.location?.name ?? "—"}
                      </td>
                      <td className="py-3 text-slate-600">
                        {[p.targetCity, p.targetRegion].filter(Boolean).join(", ")}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            p.status === "published" ? "success" : "default"
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/app/geo-pages/${p.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          Edit
                        </Link>
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
