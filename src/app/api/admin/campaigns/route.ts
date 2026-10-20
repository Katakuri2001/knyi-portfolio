import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
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
  createCampaign,
  deleteCampaign,
  listCampaigns,
  listObservations,
  updateCampaign,
} from "@/lib/db/campaigns";

/**
 * /api/admin/campaigns — the owner's own campaign register.
 *
 * This is **not** advertising platform performance data. It is a record of
 * what a campaign was for: its name, channel, objective and dates. Observed
 * traffic for a UTM set lives in a separate table and is never merged with
 * it, because one is a plan and the other is a measurement.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  return NextResponse.json({
    campaigns: listCampaigns(),
    observations: listObservations(),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const input = body as Record<string, unknown>;
  const name = cleanString(input.name, 160);
  if (!name) return badRequest("A campaign name is required.", "name");

  try {
    const campaign = createCampaign(`cmp_${randomUUID().slice(0, 8)}`, {
      name,
      channel: cleanString(input.channel, 80),
      objective: cleanString(input.objective, 400),
      service: cleanString(input.service, 120),
      startsAt: input.startsAt ? Number(input.startsAt) : null,
      endsAt: input.endsAt ? Number(input.endsAt) : null,
      notes: cleanString(input.notes, 2000),
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const input = body as Record<string, unknown>;
  const id = cleanString(input.id, 80);
  if (!id) return badRequest("A campaign id is required.");

  const name = input.name === undefined ? undefined : cleanString(input.name, 160);
  if (input.name !== undefined && !name) {
    return badRequest("A campaign name is required.", "name");
  }

  try {
    const updated = updateCampaign(id, {
      name: name ?? undefined,
      channel:
        input.channel === undefined ? undefined : cleanString(input.channel, 80),
      objective:
        input.objective === undefined
          ? undefined
          : cleanString(input.objective, 400),
      service:
        input.service === undefined ? undefined : cleanString(input.service, 120),
      startsAt:
        input.startsAt === undefined
          ? undefined
          : input.startsAt === null
            ? null
            : Number(input.startsAt),
      endsAt:
        input.endsAt === undefined
          ? undefined
          : input.endsAt === null
            ? null
            : Number(input.endsAt),
      notes:
        input.notes === undefined ? undefined : cleanString(input.notes, 2000),
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return badRequest("A campaign id is required.");

  if (!deleteCampaign(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
