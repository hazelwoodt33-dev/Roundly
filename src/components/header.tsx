"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type HeaderProps = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
};

export function Header({ title, showBack, backHref = "/dashboard" }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-fairway-100 bg-fairway-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link
              href={backHref}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-fairway-700 transition hover:bg-fairway-100"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fairway-700 text-white">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-fairway-500">
              Roundly
            </p>
            {title && (
              <h1 className="text-lg font-bold leading-tight text-fairway-900">{title}</h1>
            )}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-xl px-3 py-2 text-sm font-medium text-fairway-600 transition hover:bg-fairway-100"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
