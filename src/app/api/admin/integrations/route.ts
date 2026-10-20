import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  badRequest,
  cleanString,
  forbidden,
  isAdminRequest,
  isSameOrigin,
  readJson,
  unauthorized,
} from "@/lib/admin-api";
import { recordIntegrationState } from "@/lib/db/integrations";
import {
  checkIntegration,
  INTEGRATIONS,
  lastState,
  missingVariables,
  quickStatus,
} from "@/lib/integrations";

/**
 * /api/admin/integrations — the live status of every connected service.
 *
 * `POST` performs a **real** check against the provider. The result is
 * recorded, and only the status and a human-readable message are returned. No
 * credential, token or service-account key is ever included in a response.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  return NextResponse.json({
    integrations: INTEGRATIONS.map((definition) => {
      const state = lastState(definition.key);
      return {
        key: definition.key,
        label: definition.label,
        purpose: definition.purpose,
        requires: definition.requires,
        setup: definition.setup,
        supported: definition.supported,
        missing: missingVariables(definition),
        status: state?.status ?? quickStatus(definition),
        message: state?.message ?? null,
        lastChecked: state?.last_checked ?? null,
        lastSuccess: state?.last_success ?? null,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson(request);
  if (!body || typeof body !== "object") return badRequest("Invalid request body.");

  const key = cleanString((body as Record<string, unknown>).key, 80);
  if (!key) return badRequest("An integration key is required.");

  if (!INTEGRATIONS.some((definition) => definition.key === key)) {
    return badRequest("Unknown integration.");
  }

  const result = await checkIntegration(key);
  recordIntegrationState(key, result.status, result.message);

  return NextResponse.json({ key, ...result });
}
