import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { GeoPageEditor } from "@/components/geo/geo-page-editor";
import type { GeoPageContent } from "@/lib/ai";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await prisma.geoPage.findUnique({ where: { id } });
  return { title: page?.title ?? "GEO Page" };
}

export default async function GeoPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const page = await prisma.geoPage.findFirst({
    where: { id, tenantId: tenant.id },
  });

  if (!page) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/geo-pages"
          className="text-sm text-brand-700 hover:underline"
        >
          ← Back to GEO pages
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Edit GEO page</h1>
      </div>
      <GeoPageEditor
        page={{
          id: page.id,
          title: page.title,
          metaDescription: page.metaDescription,
          status: page.status,
          slug: page.slug,
          content: page.content as GeoPageContent,
        }}
      />
    </div>
  );
}
