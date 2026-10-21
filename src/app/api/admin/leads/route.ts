import { NextResponse } from "next/server";
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
  addLeadNote,
  deleteLead,
  isLeadStatus,
  listLeads,
  updateLead,
} from "@/lib/db/leads";

/**
 * /api/admin/leads — the private lead pipeline.
 *
 * Every route here is behind the signed-session check. Leads are personal
 * data: they are never returned by a public route, and they are never sent to
 * an analytics provider.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const params = request.nextUrl.searchParams;

  const statusParam = params.get("status");
  const status = statusParam && isLeadStatus(statusParam) ? statusParam : null;

  const fromParam = params.get("from");
  const toParam = params.get("to");
  const from = fromParam ? Number(fromParam) : null;
  const to = toParam ? Number(toParam) : null;

  const result = await listLeads({
    status,
    search: params.get("q") || null,
    from: Number.isFinite(from) ? from : null,
    to: Number.isFinite(to) ? to : null,
    limit: Number(params.get("limit")) || 50,
    offset: Number(params.get("offset")) || 0,
  });

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const input = body as Record<string, unknown>;
  const id = cleanString(input.id, 80);
  if (!id) return badRequest("A lead id is required.");

  // A status the server does not recognise is rejected outright — the client
  // cannot invent a pipeline state.
  if (input.status !== undefined && !isLeadStatus(input.status)) {
    return badRequest("Unknown lead status.", "status");
  }

  const update: Parameters<typeof updateLead>[1] = {};

  if (input.status !== undefined) update.status = input.status as never;
  if (input.name !== undefined) update.name = cleanString(input.name, 120);
  if (input.email !== undefined) update.email = cleanString(input.email, 200);
  if (input.telegram !== undefined) update.telegram = cleanString(input.telegram, 80);
  if (input.phone !== undefined) update.phone = cleanString(input.phone, 40);
  if (input.message !== undefined) update.message = cleanString(input.message, 4000);
  if (input.serviceInterest !== undefined) {
    update.serviceInterest = cleanString(input.serviceInterest, 120);
  }
  if (input.campaign !== undefined) update.campaign = cleanString(input.campaign, 120);
  if (input.source !== undefined) update.source = cleanString(input.source, 120);
  if (input.followUpAt !== undefined) {
    const value = Number(input.followUpAt);
    update.followUpAt = Number.isFinite(value) ? value : null;
  }
  if (input.dealValue !== undefined) {
    if (input.dealValue === null || input.dealValue === "") {
      update.dealValue = null;
    } else {
      const value = Number(input.dealValue);
      if (!Number.isFinite(value) || value < 0) {
        return badRequest("Deal value must be a positive number.", "dealValue");
      }
      update.dealValue = value;
    }
  }

  try {
    const updated = await updateLead(id, update);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const input = body as Record<string, unknown>;
  const id = cleanString(input.id, 80);
  const note = cleanString(input.note, 2000);

  if (!id) return badRequest("A lead id is required.");
  if (!note) return badRequest("A note cannot be empty.");

  try {
    return NextResponse.json(await addLeadNote(id, note));
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return badRequest("A lead id is required.");

  if (!await deleteLead(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
