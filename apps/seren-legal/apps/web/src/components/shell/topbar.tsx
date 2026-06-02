"use client";

import { useRouter } from "next/navigation";
import { LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function Topbar({ userName }: { userName?: string }) {
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <p className="text-sm text-slate-500">
        Welcome back, <span className="font-medium text-slate-900">{userName ?? "User"}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
