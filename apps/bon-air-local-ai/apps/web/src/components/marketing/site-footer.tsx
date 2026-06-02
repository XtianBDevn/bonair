import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Bon Air Media. Local SEO, amplified by AI.
        </p>
        <div className="flex flex-wrap gap-6 text-sm text-slate-600">
          <Link href="/pricing" className="hover:text-brand-700">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-brand-700">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-brand-700">
            Sign up
          </Link>
          <a href="mailto:legal@bonairlocal.ai" className="hover:text-brand-700">
            Privacy
          </a>
          <a href="mailto:legal@bonairlocal.ai" className="hover:text-brand-700">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
