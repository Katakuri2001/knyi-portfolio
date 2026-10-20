"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseStudy } from "@/lib/content";
import { CaseStudyManager } from "@/components/admin/CaseStudyManager";
import { SignIn } from "@/components/admin/SignIn";

/**
 * Decides between the sign-in form and the console.
 *
 * `caseStudies === null` means "not signed in" — the server component already
 * checked the session cookie, so the data never reaches an unauthenticated
 * visitor's HTML payload.
 *
 * After signing in, the cookie is set and the page is refreshed so the server
 * component re-runs and hands down the real list. The manager is keyed on the
 * ids it receives, so a fresh list remounts it with the new data rather than
 * keeping the empty one it started with.
 */
export function AdminShell({
  configured,
  caseStudies,
}: {
  configured: boolean;
  caseStudies: CaseStudy[] | null;
}) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(caseStudies !== null);

  function handleSignedIn() {
    setSignedIn(true);
    router.refresh();
  }

  if (!signedIn || caseStudies === null) {
    return (
      <div className="admin-frame">
        <SignIn configured={configured} onSignedIn={handleSignedIn} />
      </div>
    );
  }

  return (
    <div className="admin-frame">
      <CaseStudyManager
        key={caseStudies.map((study) => study.id).join(",")}
        initial={caseStudies}
        onSignOut={() => {
          setSignedIn(false);
          router.refresh();
        }}
      />
    </div>
  );
}