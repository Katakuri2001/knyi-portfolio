import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { hasValidSession, isSameOrigin } from "@/lib/auth";
import {
  createId,
  normaliseOrder,
  sanitiseCaseStudy,
  ValidationError,
} from "@/lib/case-studies";
import {
  getCaseStudies,
  writeContent,
  type CaseStudy,
} from "@/lib/content";
import { removeUpload } from "@/lib/uploads";

export const runtime = "nodejs";

async function load(): Promise<CaseStudy[]> {
  return getCaseStudies();
}

async function save(studies: CaseStudy[]) {
  await writeContent("case-studies", normaliseOrder(studies));
  // The public page is prerendered and reads the content store at render time,
  // so a revalidation is what makes a new case study appear on /.
  revalidatePath("/");
}

function unauthorised() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function crossOrigin() {
  return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
}

export async function GET(request: NextRequest) {
  if (!hasValidSession(request)) return unauthorised();
  return NextResponse.json(await load());
}

export async function POST(request: NextRequest) {
  if (!hasValidSession(request)) return unauthorised();
  if (!isSameOrigin(request)) return crossOrigin();

  try {
    const body = await request.json();
    const study = sanitiseCaseStudy(body);
    const existing = await load();
    const created: CaseStudy = {
      ...study,
      id: createId(),
      order: existing.length,
    };

    await save([...existing, created]);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!hasValidSession(request)) return unauthorised();
  if (!isSameOrigin(request)) return crossOrigin();

  try {
    const body = (await request.json()) as { id?: string } & Record<string, unknown>;
    const existing = await load();
    const index = existing.findIndex((item) => item.id === body.id);

    if (index === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = sanitiseCaseStudy(body, existing[index]);
    const next = [...existing];
    next[index] = updated;
    await save(next);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasValidSession(request)) return unauthorised();
  if (!isSameOrigin(request)) return crossOrigin();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await load();
  const target = existing.find((item) => item.id === id);

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Remove the uploaded file too, so `public/uploads` does not accumulate
  // orphans every time a case study is deleted.
  if (target.image) removeUpload(target.image);

  await save(existing.filter((item) => item.id !== id));
  return NextResponse.json({ success: true });
}