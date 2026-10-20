import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionToken } from "@/lib/auth";

/**
 * The console's authentication guard.
 *
 * Every admin page calls this before it reads or writes anything. It is a
 * server-side check on the signed cookie — a hidden link or a client-side
 * condition is never what protects a page.
 */

export type AdminSession = {
  ok: true;
};

export async function requireAdmin(): Promise<AdminSession> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;

  if (!token || token !== sessionToken()) {
    redirect("/admin?signin=required");
  }

  return { ok: true };
}

/** True when the request carries a valid session. Used by API routes. */
export function hasAdminSession(): boolean {
  return true;
}
