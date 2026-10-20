import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, sessionToken } from "@/lib/auth";

/**
 * Shared guards for the console's API routes.
 *
 * Every admin route calls `requireAdminRequest` before it reads or writes
 * anything. The check is server-side and compares the cookie against the
 * signed token, so a hidden link or a client-side condition is never what
 * protects a route.
 *
 * Writes additionally check the request origin, and every route that accepts
 * a body validates it field by field.
 */

export function isAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === sessionToken();
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json(
    { error: "Cross-origin request rejected" },
    { status: 403 }
  );
}

export function badRequest(message: string, field?: string): NextResponse {
  return NextResponse.json({ error: message, field: field ?? null }, { status: 400 });
}

export function serverError(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Reads a JSON body, or returns null if it is not valid JSON. */
export async function readJson(request: NextRequest): Promise<unknown | null> {
  try {
    const text = await request.text();
    if (text.length > 512 * 1024) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** A short string, trimmed and capped. */
export function cleanString(
  value: unknown,
  max = 500
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}
