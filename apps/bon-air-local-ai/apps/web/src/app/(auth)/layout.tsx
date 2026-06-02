import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gradient-hero px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-semibold text-slate-900"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        Bon Air Local AI
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
