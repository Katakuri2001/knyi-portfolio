import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_COOKIE, adminConfigured, sessionToken } from "@/lib/auth";
import { getCaseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Admin — Selected campaigns",
  robots: { index: false, follow: false },
};

/**
 * /admin — the private console.
 *
 * The session cookie is checked here, on the server, before anything renders.
 * An unauthenticated visitor therefore never receives the dashboard markup or
 * the case-study data in the HTML payload — the client only ever receives the
 * sign-in form. The route is dynamic because it reads cookies.
 *
 * It is deliberately not linked from the public site.
 */
export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const isAuthed = token === sessionToken();

  if (!isAuthed) {
    return <AdminShell configured={adminConfigured()} caseStudies={null} />;
  }

  return <AdminShell configured caseStudies={getCaseStudies()} />;
}