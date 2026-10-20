import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearSessionCookie, isSecureRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response, isSecureRequest(request));
  return response;
}