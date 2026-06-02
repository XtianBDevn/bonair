import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChatWidget } from "./chat-widget";
import { getTenantBySlug } from "@/lib/tenant";

type Props = { params: Promise<{ firmSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { firmSlug } = await params;
  const tenant = await getTenantBySlug(firmSlug);
  return {
    title: tenant ? `${tenant.name} — Legal Intake` : "Intake Chat",
    robots: { index: false, follow: false },
  };
}

export default async function WidgetChatPage({ params }: Props) {
  const { firmSlug } = await params;
  const tenant = await getTenantBySlug(firmSlug);
  if (!tenant) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0f172a] to-indigo-950">
      <ChatWidget firmSlug={firmSlug} firmName={tenant.name} />
    </div>
  );
}
