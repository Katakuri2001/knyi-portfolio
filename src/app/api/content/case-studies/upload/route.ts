import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasValidSession, isSameOrigin } from "@/lib/auth";
import { saveUpload, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * POST /api/content/case-studies/upload
 *
 * Accepts `multipart/form-data` with a single `file` field, stores it in
 * `public/uploads/` and returns the public path plus its pixel dimensions.
 *
 * The dimensions are returned so the editor can store a real aspect ratio and
 * the public page can reserve the right box before the image loads — that is
 * what keeps adding a case study from shifting the Work section.
 *
 * This route does not create a case study; the client posts the returned path
 * to /api/content/case-studies afterwards. That split keeps a failed save
 * recoverable without leaving an orphan upload.
 */
export async function POST(request: NextRequest) {
  if (!hasValidSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
  }

  try {
    const stored = await saveUpload(file);
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}