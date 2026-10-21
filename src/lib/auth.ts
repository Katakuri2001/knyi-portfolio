import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { isSecureRequest, requestHost } from "./request-origin.ts";

/**
 * Admin session helpers.
 *
 * ## What changed and why
 *
 * The original auth route compared the supplied password to `ADMIN_PASSWORD`
 * and then set a cookie whose value was the literal string `"authenticated"`.
 * That value is forgeable: anyone who knows it can hand-write the cookie and
 * get past the check on every content route. It was harmless while those routes
 * were unused; now that a dashboard writes to disk, it is not.
 *
 * The session value is now an HMAC of a fixed seed keyed by the admin
 * password. It cannot be produced without knowing the password, and
 * `timingSafeEqual` keeps the comparison constant-time.
 *
 * The password itself is unchanged — set `ADMIN_PASSWORD` and everything
 * behaves as before. What is new is that **production refuses to run without
 * it**, rather than silently falling back to a hardcoded default.
 */

export const ADMIN_COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_SEED = "knyi-admin-session-v1";

function adminSecret(): string {
  const configured = process.env.ADMIN_PASSWORD;

  if (configured && configured.length > 0) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_PASSWORD is not set. The admin console will not start in production without it."
    );
  }

  return "development-only-admin-password";
}

function digest(value: string): Buffer {
  return createHmac("sha256", adminSecret()).update(value).digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when `candidate` is the configured admin password. */
export function passwordMatches(candidate: string): boolean {
  // The secret IS the password, so hashing the candidate with the same key
  // only matches when the candidate is the password itself.
  return safeEqual(digest(candidate), digest(adminSecret()));
}

/** The value stored in the session cookie. */
export function sessionToken(): string {
  return digest(SESSION_SEED).toString("base64url");
}

export function hasValidSession(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = Buffer.from(sessionToken());
  const provided = Buffer.from(token);
  return safeEqual(provided, expected);
}

/**
 * Defence in depth against cross-site writes. The cookie is already
 * `SameSite=Strict`, so a cross-site form post would not carry it — this
 * rejects the remainder.
 *
 * The comparison is against the host the **visitor** addressed, not against
 * `request.nextUrl.host`. On Cloudflare Workers the request reaches the
 * application on an internal origin, so `nextUrl` names the wrong host and
 * every legitimate write would be rejected. See `src/lib/request-origin.ts`.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === requestHost(request);
  } catch {
    return false;
  }
}

export { isSecureRequest };

export function setSessionCookie(response: NextResponse, secure: boolean) {
  response.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse, secure: boolean) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/** Whether the console can run at all — used by the admin page to show a
 *  setup notice instead of a sign-in form that can never succeed. */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
}