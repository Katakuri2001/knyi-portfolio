"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Signs out of the console.
 *
 * A button rather than a link, deliberately. `next/link` prefetches its
 * target — and prefetching a GET route handler **executes** it, so a link to
 * `/api/auth/signout` would clear the session as soon as the console rendered,
 * not when it was clicked.
 */
export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/signout", { method: "GET" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={className}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
