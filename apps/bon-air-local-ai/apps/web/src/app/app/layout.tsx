import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { AppHeader } from "@/components/shell/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, tenant } = await getTenantContext();
  if (!session || !tenant) {
    redirect("/login");
  }

  const user = await import("@/lib/db").then(({ prisma }) =>
    prisma.user.findUnique({ where: { id: session.sub } })
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar tenantName={tenant.name} />
      <div className="flex flex-1 flex-col">
        <AppHeader userName={user?.name ?? null} userEmail={session.email} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
