import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { forbidden, isAdminRequest, isSameOrigin, unauthorized } from "@/lib/admin-api";
import { runTechnicalAudit } from "@/lib/seo/audit";
import { requestOrigin } from "@/lib/request-origin";

/**
 * POST /api/admin/seo/audit — runs the technical SEO audit.
 *
 * The audit takes **no URL**. Its destinations come from `PUBLIC_ROUTES` in
 * the repository, so there is no field anywhere that could be used to make the
 * server fetch an arbitrary address.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  try {
    // Audit the instance that is actually running, so the findings describe
    // the build in front of you.
    const result = await runTechnicalAudit(requestOrigin(request));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message.slice(0, 300) },
      { status: 500 }
    );
  }
}
