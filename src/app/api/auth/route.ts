import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  adminConfigured,
  clearSessionCookie,
  hasValidSession,
  isSameOrigin,
  passwordMatches,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { password?: string };
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (passwordMatches(password)) {
      const response = NextResponse.json({ success: true });
      setSessionCookie(response);
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: hasValidSession(request),
    configured: adminConfigured(),
  });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}