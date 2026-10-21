import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * GET /api/uploads/<name>
 *
 * Serves an uploaded campaign image.
 *
 * Uploads are written after the build, and `next start` snapshots `public/` at
 * build time, so a file in `public/uploads/` is not reachable at
 * `/uploads/<name>` until the next build. This handler always reads from the
 * store — the local directory on a Node host, the R2 bucket on Cloudflare — so
 * an upload is live the moment it is saved.
 *
 * The filename is matched against a strict pattern before it is used, so a
 * crafted path cannot escape the uploads directory.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;

  const stored = await readUpload(name);
  if (!stored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // A Buffer is a Uint8Array, which Next's Response body accepts.
  const body = new Uint8Array(stored.body);

  return new NextResponse(body, {
    headers: {
      "Content-Type": stored.contentType,
      "Content-Length": String(body.byteLength),
      // Filenames are unique per upload, so the bytes never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
