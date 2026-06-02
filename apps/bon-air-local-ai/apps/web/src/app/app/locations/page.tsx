import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationForm } from "@/components/locations/location-form";
import { LocationRow } from "@/components/locations/location-row";

export const metadata = { title: "Locations" };

export default async function LocationsPage() {
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const locations = await prisma.businessLocation.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
        <p className="text-slate-600">Business locations for GEO pages and GBP posts</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your locations ({locations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {locations.length === 0 ? (
              <p className="text-sm text-slate-500">No locations yet.</p>
            ) : (
              <ul className="space-y-4">
                {locations.map((loc) => {
                  const addr = loc.address as {
                    street?: string;
                    city?: string;
                    region?: string;
                    postalCode?: string;
                  };
                  return (
                    <LocationRow
                      key={loc.id}
                      location={{
                        id: loc.id,
                        name: loc.name,
                        street: addr.street,
                        city: addr.city ?? "",
                        region: addr.region ?? "",
                        postalCode: addr.postalCode,
                        phone: loc.phone ?? undefined,
                        website: loc.website ?? undefined,
                        primaryCategory: loc.primaryCategory ?? undefined,
                      }}
                    />
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
