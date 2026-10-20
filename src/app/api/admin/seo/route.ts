import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import {
  badRequest,
  cleanString,
  forbidden,
  isAdminRequest,
  isSameOrigin,
  readJson,
  serverError,
  unauthorized,
} from "@/lib/admin-api";
import {
  deleteSeoMetadata,
  listSeoMetadata,
  setSeoMetadata,
} from "@/lib/db/seo";
import { isPrivatePath, PUBLIC_ROUTES } from "@/lib/seo/public-routes";

/**
 * /api/admin/seo — the technical audit and the per-path metadata editor.
 *
 * ## The audit
 *
 * The technical audit lives at `POST /api/admin/seo/audit`.
 * 
 * ## The metadata editor
 *
 * `PUT /api/admin/seo/metadata` writes a per-path override that the public
 * page's `generateMetadata` reads. The path must be one the site actually
 * serves, and it must not be a private path.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  return NextResponse.json({ overrides: listSeoMetadata() });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const input = body as Record<string, unknown>;
  const path = cleanString(input.path, 200);

  if (!path) return badRequest("A path is required.", "path");
  if (!path.startsWith("/")) {
    return badRequest("The path must be site-relative, starting with /.", "path");
  }
  if (isPrivatePath(path)) {
    return badRequest("That path is private and cannot have metadata.", "path");
  }
  if (!PUBLIC_ROUTES.some((route) => route.path === path)) {
    return badRequest("That path is not a public page of this site.", "path");
  }

  const canonical = cleanString(input.canonicalUrl, 400);
  if (canonical !== null && !/^https:\/\/[^\s]+$/i.test(canonical)) {
    return badRequest(
      "A canonical URL must be an absolute https URL.",
      "canonicalUrl"
    );
  }

  const noindex = input.noindex === true;

  // Guard: noindexing the whole site is a big decision, so it has to be
  // explicit twice.
  if (noindex && path === "/") {
    if (input.confirmNoindex !== true) {
      return badRequest(
        "Confirm that you want to remove the whole site from search results.",
        "noindex"
      );
    }
  }

  const ogImage = cleanString(input.ogImage, 400);
  if (ogImage !== null && !ogImage.startsWith("/")) {
    return badRequest("The social image must be a site-relative path.", "ogImage");
  }

  try {
    const row = setSeoMetadata(path, {
      seoTitle: cleanString(input.seoTitle, 160),
      metaDescription: cleanString(input.metaDescription, 320),
      canonicalUrl: canonical,
      ogTitle: cleanString(input.ogTitle, 160),
      ogDescription: cleanString(input.ogDescription, 320),
      ogImage,
      noindex,
    });
    // The public page is prerendered and cached, so the change only reaches
    // the site once the page is regenerated.
    revalidatePath("/");
    return NextResponse.json(row);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return badRequest("A path is required.");

  if (!deleteSeoMetadata(path)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidatePath("/");
  return NextResponse.json({ success: true });
}
