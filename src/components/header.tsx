"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type HeaderProps = {
title?: string;
showBack?: boolean;
};

export function Header({
title,
showBack = false,
}: HeaderProps) {
const router = useRouter();
const supabase = createClient();

async function handleSignOut() {
await supabase.auth.signOut();


router.push("/login");
router.refresh();


}

return ( <header className="sticky top-0 z-50 border-b border-fairway-100 bg-white/95 backdrop-blur"> <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">


    <div className="flex items-center gap-3">

      {showBack && (
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 transition hover:bg-fairway-100"
        >
          <ChevronLeft
            size={22}
          />
        </button>
      )}

      <Link
        href="/"
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fairway-600 font-black text-white">
          R
        </div>

        <div>
          <p className="text-sm text-fairway-500">
            Roundly
          </p>

          <h1 className="font-bold text-fairway-950">
            {title ??
              "Live scoring"}
          </h1>
        </div>
      </Link>

    </div>

    <div className="flex items-center gap-2">

      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-fairway-700 transition hover:bg-fairway-100"
      >
        <User
          size={18}
        />

        Profile
      </Link>

      <button
        onClick={
          handleSignOut
        }
        className="rounded-xl bg-fairway-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fairway-700"
      >
        Sign out
      </button>

    </div>

  </div>
</header>

);
}
