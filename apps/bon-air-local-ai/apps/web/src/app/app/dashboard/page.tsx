import Link from "next/link";
import { FileText, MapPin, Megaphone, Sparkles, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { getCitationHealthForTenant } from "@/lib/citations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const [locations, geoTotal, geoPublished, gbpTotal, gbpScheduled, recentPages, citationHealth] =
    await Promise.all([
      prisma.businessLocation.count({ where: { tenantId: tenant.id } }),
      prisma.geoPage.count({ where: { tenantId: tenant.id } }),
      prisma.geoPage.count({
        where: { tenantId: tenant.id, status: "published" },
      }),
      prisma.gbpPost.count({ where: { tenantId: tenant.id } }),
      prisma.gbpPost.count({
        where: { tenantId: tenant.id, status: "scheduled" },
      }),
      prisma.geoPage.findMany({
        where: { tenantId: tenant.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, targetCity: true, updatedAt: true },
      }),
      getCitationHealthForTenant(tenant.id),
    ]);

  const stats = [
    { label: "Locations", value: locations, icon: MapPin, href: "/app/locations" },
    {
      label: "GEO Pages",
      value: geoTotal,
      sub: `${geoPublished} published`,
      icon: FileText,
      href: "/app/geo-pages",
    },
    {
      label: "GBP Posts",
      value: gbpTotal,
      sub: `${gbpScheduled} scheduled`,
      icon: Megaphone,
      href: "/app/gbp",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Welcome back to {tenant.name}</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500">Citation health</p>
            <p className="text-2xl font-bold text-slate-900">
              {citationHealth.healthy}/{citationHealth.total} healthy
            </p>
            <p className="text-xs text-slate-500">
              {citationHealth.mismatch > 0
                ? `${citationHealth.mismatch} NAP mismatch · `
                : ""}
              {citationHealth.missing > 0
                ? `${citationHealth.missing} missing · `
                : ""}
              {citationHealth.lastCrawlAt
                ? `Last check ${new Date(citationHealth.lastCrawlAt).toLocaleDateString()}`
                : "Not crawled yet"}
            </p>
          </div>
          <Badge
            variant={
              citationHealth.mismatch + citationHealth.missing === 0
                ? "success"
                : "warning"
            }
          >
            {citationHealth.mismatch + citationHealth.missing === 0
              ? "Good"
              : "Needs attention"}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    {s.sub && (
                      <p className="text-xs text-slate-500">{s.sub}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent GEO pages</CardTitle>
          <Link href="/app/geo-pages/new">
            <Button size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate page
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentPages.length === 0 ? (
            <p className="text-sm text-slate-500">No GEO pages yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPages.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <Link
                    href={`/app/geo-pages/${p.id}`}
                    className="font-medium text-slate-900 hover:text-brand-700"
                  >
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-3">
                    {p.targetCity && (
                      <span className="text-sm text-slate-500">{p.targetCity}</span>
                    )}
                    <Badge
                      variant={p.status === "published" ? "success" : "default"}
                    >
                      {p.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
