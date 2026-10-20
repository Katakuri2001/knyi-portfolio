import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function GET() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}