import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  contentTypeFor,
  filenameFromPublicPath,
  UPLOAD_DIR,
} from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * GET /api/uploads/<name>
 *
 * Serves an uploaded campaign image from disk.
 *
 * Uploads are written after the build, and `next start` snapshots `public/` at
 * build time, so a file in `public/uploads/` is not reachable at
 * `/uploads/<name>` until the next build. This handler always reads from disk,
 * so an upload is live the moment it is saved.
 *
 * The filename is matched against a strict pattern before it is used, so a
 * crafted path cannot escape the uploads directory.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;

  const filename = filenameFromPublicPath(`/api/uploads/${name}`);
  if (!filename) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = fs.readFileSync(filePath);

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentTypeFor(filename),
      "Content-Length": String(body.length),
      // Filenames are unique per upload, so the bytes never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
