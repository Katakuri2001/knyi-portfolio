import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-api";
import { exportContent } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/content/export — the current content, as JSON.
 *
 * ## Why this exists
 *
 * The content lives in the database, not in `content/*.json`. That is what
 * lets the console work on a platform with no writable filesystem — Cloudflare
 * Workers, for one.
 *
 * The trade-off is that the files in `content/` are now the **seed** rather
 * than the live copy. The GitHub Pages export is built from a checkout of the
 * repository, so it would carry the seed and not the edits made in the
 * console. This route closes that loop: it returns exactly what the site is
 * serving, as a file the owner can commit.
 *
 * The file is a **download**, not a page. It is reached by a plain link with
 * the `download` attribute, never by `next/link` — a prefetch would execute
 * the route without anyone asking for it.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const content = await exportContent();
  const filename = `knyi-content-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(content, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
