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
  createExperiment,
  deleteExperiment,
  isExperimentStatus,
  listExperiments,
  updateExperiment,
} from "@/lib/db/experiments";

/**
 * /api/admin/experiments — the experiment log.
 *
 * A manual record of a hypothesis, a change, the metric being watched, and
 * what was observed. There is no split-testing engine behind it, and the
 * console never computes a winner from this table: with no control group
 * there is nothing to compare against.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  return NextResponse.json({ experiments: await listExperiments() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const input = body as Record<string, unknown>;
  const hypothesis = cleanString(input.hypothesis, 1000);
  if (!hypothesis) {
    return badRequest("A hypothesis is required.", "hypothesis");
  }

  if (input.status !== undefined && !isExperimentStatus(input.status)) {
    return badRequest("Unknown experiment status.", "status");
  }

  try {
    const experiment = await createExperiment(`exp_${randomUUID().slice(0, 8)}`, {
      hypothesis,
      target: cleanString(input.target, 200),
      change: cleanString(input.change, 2000),
      primaryMetric: cleanString(input.primaryMetric, 200),
      secondaryMetric: cleanString(input.secondaryMetric, 200),
      status: isExperimentStatus(input.status) ? input.status : "planned",
      startedAt: input.startedAt ? Number(input.startedAt) : null,
      endedAt: input.endedAt ? Number(input.endedAt) : null,
      result: cleanString(input.result, 2000),
      conclusion: cleanString(input.conclusion, 2000),
      nextAction: cleanString(input.nextAction, 1000),
    });
    return NextResponse.json(experiment, { status: 201 });
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
  if (!id) return badRequest("An experiment id is required.");

  if (input.status !== undefined && !isExperimentStatus(input.status)) {
    return badRequest("Unknown experiment status.", "status");
  }

  if (input.hypothesis !== undefined) {
    const hypothesis = cleanString(input.hypothesis, 1000);
    if (!hypothesis) {
      return badRequest("A hypothesis is required.", "hypothesis");
    }
  }

  try {
    const updated = await updateExperiment(id, {
      hypothesis:
        input.hypothesis === undefined
          ? undefined
          : (cleanString(input.hypothesis, 1000) ?? undefined),
      target:
        input.target === undefined ? undefined : cleanString(input.target, 200),
      change:
        input.change === undefined ? undefined : cleanString(input.change, 2000),
      primaryMetric:
        input.primaryMetric === undefined
          ? undefined
          : cleanString(input.primaryMetric, 200),
      secondaryMetric:
        input.secondaryMetric === undefined
          ? undefined
          : cleanString(input.secondaryMetric, 200),
      status: isExperimentStatus(input.status) ? input.status : undefined,
      startedAt:
        input.startedAt === undefined
          ? undefined
          : input.startedAt === null
            ? null
            : Number(input.startedAt),
      endedAt:
        input.endedAt === undefined
          ? undefined
          : input.endedAt === null
            ? null
            : Number(input.endedAt),
      result:
        input.result === undefined ? undefined : cleanString(input.result, 2000),
      conclusion:
        input.conclusion === undefined
          ? undefined
          : cleanString(input.conclusion, 2000),
      nextAction:
        input.nextAction === undefined
          ? undefined
          : cleanString(input.nextAction, 1000),
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
  if (!id) return badRequest("An experiment id is required.");

  if (!await deleteExperiment(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
