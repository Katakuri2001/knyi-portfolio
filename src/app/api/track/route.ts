import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { recordEvents } from "@/lib/db/events";
import { isSecureRequest } from "@/lib/request-origin";
import { observeCampaign } from "@/lib/db/campaigns";
import {
  classifyBrowser,
  classifyChannel,
  classifyDevice,
  mergeAttribution,
  readUtm,
  referrerHost,
} from "@/lib/analytics/attribution";
import {
  MAX_EVENTS_PER_REQUEST,
  MAX_EVENT_PAYLOAD_BYTES,
  validateEvent,
  type AnalyticsEventName,
} from "@/lib/analytics/events";
import { getVisitor } from "@/lib/db/events";

/**
 * POST /api/track — first-party event ingestion.
 *
 * The browser posts a small, typed batch of events. Everything about the
 * request is treated as untrusted:
 *
 * - the event name must be on the allowlist;
 * - the property keys must be on that event's schema, and a key that looks
 *   like personal data rejects the whole payload;
 * - the payload is size-capped and the batch count is capped;
 * - the visitor and session identifiers are taken from the request's
 *   **cookies**, not from the body, so a client cannot attribute events to
 *   somebody else's session.
 *
 * No IP address is read or stored.
 */

export const runtime = "nodejs";

/** Session cookie names. */
const VISITOR_COOKIE = "knyi_vid";
const SESSION_COOKIE = "knyi_sid";

/** 30 minutes of inactivity ends a session. */
const SESSION_TTL_SECONDS = 30 * 60;

export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (raw.length > MAX_EVENT_PAYLOAD_BYTES * MAX_EVENTS_PER_REQUEST) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    events?: unknown;
    path?: unknown;
    referrer?: unknown;
    width?: unknown;
    mobile?: unknown;
    userAgent?: unknown;
    country?: unknown;
    utm?: unknown;
  };

  if (!Array.isArray(payload.events)) {
    return NextResponse.json({ error: "No events supplied" }, { status: 400 });
  }

  if (payload.events.length > MAX_EVENTS_PER_REQUEST) {
    return NextResponse.json({ error: "Too many events" }, { status: 413 });
  }

  const cookies = request.cookies;
  const visitorId = cookies.get(VISITOR_COOKIE)?.value ?? randomUUID();
  const existingSession = cookies.get(SESSION_COOKIE)?.value ?? null;

  const sessionId =
    existingSession ??
    `s_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  // Attribution comes from the request's own URL and referrer.
  const utm = readUtm(request.nextUrl.search);
  const host = referrerHost(
    typeof payload.referrer === "string" ? payload.referrer : null
  );
  const channel = classifyChannel(utm, host);

  const path =
    typeof payload.path === "string" ? payload.path.slice(0, 300) : null;

  const deviceCategory = classifyDevice(
    typeof payload.width === "number" ? payload.width : undefined,
    payload.mobile === true
  );
  const browserCategory = classifyBrowser(
    typeof payload.userAgent === "string" ? payload.userAgent : undefined
  );
  const country =
    typeof payload.country === "string"
      ? payload.country.slice(0, 2).toUpperCase()
      : null;

  // Merge into the stored attribution, honouring first-touch and
  // last-non-direct rules.
  const stored = await getVisitor(visitorId);
  const previous = stored
    ? {
        channel: (stored.first_utm
          ? classifyChannel(JSON.parse(stored.first_utm), stored.first_referrer)
          : "direct") as never,
        referrerHost: stored.first_referrer,
        utm: stored.first_utm ? JSON.parse(stored.first_utm) : readUtm(""),
      }
    : null;

  const merged = mergeAttribution(previous, { channel, referrerHost: host, utm });

  const validated: {
    name: AnalyticsEventName;
    props: Record<string, string | number>;
  }[] = [];

  for (const rawEvent of payload.events) {
    const event = rawEvent as { name?: unknown; props?: unknown };
    const result = validateEvent(event.name, event.props);
    if (!result) continue;
    validated.push({ name: result.name, props: result.props });
  }

  if (validated.length === 0) {
    return NextResponse.json({ accepted: 0, stored: 0 });
  }

  const stored2 = await recordEvents(
    validated.map((event) => {
      const props: Record<string, string | number> = { ...event.props, channel };
      if (path) props.path = path;
      if (host) props.referrer_host = host;
      return { name: event.name, props };
    }),
    {
      visitorId,
      sessionId,
      path,
      referrerHost: host,
      channel: merged.last.channel,
      utm: merged.last.utm,
      deviceCategory,
      browserCategory,
      country,
    }
  );

  await observeCampaign(merged.first.utm, 1, 0);

  const secure = isSecureRequest(request);

  const response = NextResponse.json({ accepted: validated.length, stored: stored2 });
  attachVisitorCookies(response, visitorId, sessionId, secure);
  return response;
}

function attachVisitorCookies(
  response: NextResponse,
  visitorId: string,
  sessionId: string,
  secure: boolean
) {

  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });

  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** A stable, non-reversible id for a request, used only for rate limiting. */
export function rateKey(request: NextRequest, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "local";
  const material = `${scope}:${ip}`;
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
}
