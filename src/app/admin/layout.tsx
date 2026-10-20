import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { ConsoleShell } from "@/components/admin/ConsoleShell";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { ADMIN_COOKIE, adminConfigured, sessionToken } from "@/lib/auth";

/**
 * The console shell.
 *
 * The session cookie is checked here, on the server, before any page renders.
 * An unauthenticated visitor receives the sign-in form and nothing else — no
 * navigation, no data, and no markup that would describe what is behind the
 * login.
 *
 * Every admin page inherits this check, so a new page cannot accidentally be
 * left unprotected.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const isAuthed = Boolean(token) && token === sessionToken();

  if (!isAuthed) {
    return (
      <div className="min-h-dvh bg-background">
        <AdminSignIn configured={adminConfigured()} />
      </div>
    );
  }

  return (
    <ConsoleShell title="K-Nyi — Admin">
      {children}
    </ConsoleShell>
  );
}
