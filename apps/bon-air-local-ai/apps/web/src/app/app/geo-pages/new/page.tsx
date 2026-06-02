import Link from "next/link";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { GeoPageCreateForm } from "@/components/geo/geo-page-create-form";

export const metadata = { title: "New GEO Page" };

export default async function NewGeoPagePage() {
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const locations = await prisma.businessLocation.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/geo-pages"
          className="text-sm text-brand-700 hover:underline"
        >
          ← Back to GEO pages
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Generate GEO page</h1>
      </div>
      <GeoPageCreateForm locations={locations} />
    </div>
  );
}
