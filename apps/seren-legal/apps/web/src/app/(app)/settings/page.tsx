import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionFromCookies, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOpenAIMode, getAppUrl, isStripeConfigured, isTwilioConfigured } from "@/lib/env";
import { BillingActions } from "@/components/billing/billing-actions";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const user = await getCurrentUser(session);
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = getAppUrl();
  const embedCode = user?.tenant.slug
    ? `<iframe src="${appUrl}/widget/chat/${user.tenant.slug}" width="400" height="600" style="border:0;border-radius:12px" title="${user.tenant.name} intake"></iframe>`
    : "";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Firm profile, billing, and embed</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Firm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-slate-500">Name:</span> {user?.tenant.name}
          </p>
          <p>
            <span className="text-slate-500">Slug:</span> {user?.tenant.slug}
          </p>
          <p>
            <span className="text-slate-500">Plan:</span> {user?.tenant.plan?.name ?? "None"}
          </p>
          <p className="text-slate-500">
            Chatbot:{" "}
            <a
              href={`/widget/chat/${user?.tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline"
            >
              /widget/chat/{user?.tenant.slug}
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embed widget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-slate-500">
            Paste this iframe on your website, or link directly to the chat URL above.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
            {embedCode}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {subscription && (
            <p>
              <span className="text-slate-500">Status:</span>{" "}
              <Badge>{subscription.status}</Badge>
            </p>
          )}
          <BillingActions
            hasSubscription={Boolean(subscription?.stripeCustomerId)}
            stripeConfigured={isStripeConfigured()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>OpenAI</span>
            <Badge className="border border-slate-200 bg-white">
              {getOpenAIMode() === "live" ? "Connected" : "Template"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Twilio SMS</span>
            <Badge className="border border-slate-200 bg-white">
              {isTwilioConfigured() ? "Configured" : "Stub (dev log)"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Stripe</span>
            <Badge className="border border-slate-200 bg-white">
              {isStripeConfigured() ? "Configured" : "Not configured"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-slate-500">{user?.email}</p>
          <p className="capitalize text-slate-500">Role: {user?.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}
