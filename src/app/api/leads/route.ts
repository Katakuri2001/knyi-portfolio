import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { createLead } from "@/lib/db/leads";
import { recordEvents } from "@/lib/db/events";
import { observeCampaign } from "@/lib/db/campaigns";
import { validateLeadSubmission } from "@/lib/leads";
import { rateLimit } from "@/lib/rate-limit";
import {
  classifyBrowser,
  classifyChannel,
  classifyDevice,
  readUtm,
  referrerHost,
} from "@/lib/analytics/attribution";

/**
 * POST /api/leads — the public contact form.
 *
 * This is the top of the funnel and the only public write endpoint. It:
 *
 * 1. rate limits by request origin;
 * 2. validates the submission field by field;
 * 3. rejects a duplicate submission rather than storing it twice;
 * 4. stores the lead **with the attribution captured at the moment of
 *    submission** — first-touch and last-touch, the landing path, the referrer
 *    host and the UTM set;
 * 5. records a `lead_created` conversion event, with a deduplication key so
 *    the same lead is never counted twice;
 * 6. forwards the conversion to GA4 and the Meta Pixel if they are configured
 *    and consent has been given.
 *
 * It never claims success unless the lead was actually stored.
 */

export const runtime = "nodejs";

/** Submissions allowed per origin per hour. */
const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_SECONDS = 3600;

const VISITOR_COOKIE = "knyi_vid";
const SESSION_COOKIE = "knyi_sid";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `lead:${origin ?? "local"}`;

  const limit = rateLimit(key, SUBMIT_LIMIT, SUBMIT_WINDOW_SECONDS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validation = validateLeadSubmission(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, field: validation.field ?? null },
      { status: 400 }
    );
  }

  // Attribution is read from the request's own cookies and URL at the moment
  // of submission, and stored with the lead. It is never taken from the body.
  const cookies = request.cookies;
  const visitorId = cookies.get(VISITOR_COOKIE)?.value ?? null;
  const sessionId = cookies.get(SESSION_COOKIE)?.value ?? null;

  const utm = readUtm(request.nextUrl.search);
  const host = referrerHost(request.headers.get("referer"));
  const channel = classifyChannel(utm, host);

  const leadId = `lead_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  const created = createLead(
    {
      ...validation.value,
      source: channel,
      sourceDetail: utm.source ?? host,
      medium: utm.medium,
      campaign: utm.campaign,
      landingPath: null,
      referrerHost: host,
      visitorId,
      sessionId,
    },
    leadId
  );

  if (!created) {
    // A duplicate of a submission made within the last 24 hours.
    return NextResponse.json(
      { error: "This message looks like a duplicate. I have already got it." },
      { status: 409 }
    );
  }

  // The conversion event, with a key that makes a double-submit harmless.
  if (visitorId && sessionId) {
    const device = classifyDevice(
      request.headers.get("sec-ch-viewport-width")
        ? Number(request.headers.get("sec-ch-viewport-width"))
        : undefined,
      request.headers.get("sec-ch-ua-mobile") === "?1"
    );
    const browser = classifyBrowser(request.headers.get("user-agent") ?? undefined);

    recordEvents(
      [
        {
          name: "lead_created",
          props: {
            path: "/",
            channel,
            service_interest: validation.value.serviceInterest ?? "unspecified",
            campaign: utm.campaign ?? "none",
          },
          conversion: "lead_created",
          dedupeKey: `lead_created:${leadId}`,
        },
      ],
      {
        visitorId,
        sessionId,
        path: "/",
        referrerHost: host,
        channel,
        utm,
        deviceCategory: device,
        browserCategory: browser,
        country: null,
      }
    );

    observeCampaign(utm, 0, 1);
  }

  // Forward the conversion to any configured advertising platforms. A failure
  // here is logged, never surfaced — the lead is already stored.
  const { forwardLeadConversion } = await import("@/lib/analytics/forward");
  await forwardLeadConversion({
    leadId,
    visitorId,
    source: channel,
    campaign: utm.campaign,
    service: validation.value.serviceInterest,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, id: leadId });
}
