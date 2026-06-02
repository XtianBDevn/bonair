import { getSessionFromCookies, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const user = await getCurrentUser(session);
  const userName = user ? `${user.firstName} ${user.lastName}` : session.firstName;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar tenantName={user?.tenant.name} />
      <div className="flex flex-1 flex-col">
        <Topbar userName={userName} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
