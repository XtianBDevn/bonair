import Link from "next/link";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { getOpenAIMode, isStripeConfigured } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingActions } from "@/components/billing/billing-actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { session, tenant, membership } = await getTenantContext();
  if (!tenant || !session) return null;

  const [user, subscription, usageThisMonth] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub } }),
    prisma.subscription.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    }),
    prisma.usageEvent.groupBy({
      by: ["kind"],
      where: {
        tenantId: tenant.id,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { quantity: true },
    }),
  ]);

  const limits = (tenant.plan?.limits ?? {}) as Record<string, number>;
  const openaiMode = getOpenAIMode();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Workspace, billing, and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Tenant-scoped organization settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Slug</span>
            <span className="font-mono text-slate-700">{tenant.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Plan</span>
            <Badge variant="brand">{tenant.plan?.name ?? "None"}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Agency mode</span>
            <span>{tenant.isAgency ? "Yes" : "No"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing & usage</CardTitle>
          <CardDescription>
            {isStripeConfigured()
              ? "Manage subscription via Stripe"
              : "Set STRIPE_SECRET_KEY to enable checkout"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {subscription && (
            <div className="flex justify-between">
              <span className="text-slate-500">Subscription</span>
              <Badge>{subscription.status}</Badge>
            </div>
          )}
          <div>
            <p className="mb-2 font-medium text-slate-700">This month</p>
            <ul className="space-y-1 text-slate-600">
              {usageThisMonth.length === 0 && <li>No usage recorded yet</li>}
              {usageThisMonth.map((row) => (
                <li key={row.kind} className="flex justify-between">
                  <span>{row.kind.replace(/_/g, " ")}</span>
                  <span>
                    {Number(row._sum.quantity ?? 0)}
                    {limits.aiCredits && row.kind === "ai_geo_generate"
                      ? ` / ${limits.aiCredits} credits`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <BillingActions
            hasSubscription={Boolean(subscription?.stripeCustomerId)}
            stripeConfigured={isStripeConfigured()}
          />
          <Link href="/pricing" className="text-brand-700 hover:underline">
            View plans →
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{user?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <Badge>{membership?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>OpenAI</span>
            <Badge variant={openaiMode === "live" ? "brand" : "default"}>
              {openaiMode === "live" ? "Connected" : "Template mode"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Google Business Profile</span>
            <Badge>Stub publish</Badge>
          </div>
          <div className="flex justify-between">
            <span>Stripe</span>
            <Badge variant={isStripeConfigured() ? "brand" : "default"}>
              {isStripeConfigured() ? "Configured" : "Not configured"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
