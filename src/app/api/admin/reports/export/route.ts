import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { forbidden, isAdminRequest, isSameOrigin, unauthorized } from "@/lib/admin-api";
import { exportLeads } from "@/lib/db/leads";
import { resolveRange } from "@/lib/date-range";

/**
 * GET /api/admin/reports/export?format=leads|events&from=&to=
 *
 * A CSV export of the same data the reports page shows. It uses the same
 * date-range resolution, so a report and its export always cover the same
 * window.
 *
 * Two protections on the CSV, because a spreadsheet will happily execute what
 * a cell contains:
 *
 * 1. **Formula injection** — a value beginning with `=`, `+`, `-` or `@` is
 *    prefixed with a single quote, so a message body can never become a
 *    formula.
 * 2. **Minimisation** — the lead export omits the message body by default,
 *    and includes it only when explicitly asked for.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (text.length > 0 && FORMULA_PREFIXES.includes(text[0])) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(escapeCsvValue).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvValue).join(","));
  }
  return lines.join("\r\n");
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOrigin(request)) return forbidden();

  const params = request.nextUrl.searchParams;
  const range = resolveRange({
    range: params.get("range"),
    from: params.get("from"),
    to: params.get("to"),
  });

  const format = params.get("format") ?? "leads";
  const includeMessages = params.get("includeMessages") === "true";

  let csv: string;
  let filename: string;

  if (format === "leads") {
    const leads = await exportLeads(range);
    const headers = [
      "id",
      "created_at",
      "status",
      "name",
      "email",
      "telegram",
      "phone",
      "service_interest",
      "source",
      "medium",
      "campaign",
      "landing_path",
      "referrer_host",
      "deal_value",
      "follow_up_at",
    ];
    if (includeMessages) headers.push("message");

    csv = toCsv(
      headers,
      leads.map((lead) => {
        const row: (string | number | null)[] = [
          lead.id,
          new Date(lead.created_at * 1000).toISOString(),
          lead.status,
          lead.name,
          lead.email,
          lead.telegram,
          lead.phone,
          lead.service_interest,
          lead.source,
          lead.medium,
          lead.campaign,
          lead.landing_path,
          lead.referrer_host,
          lead.deal_value,
          lead.follow_up_at ? new Date(lead.follow_up_at * 1000).toISOString() : null,
        ];
        if (includeMessages) row.push(lead.message);
        return row;
      })
    );
    filename = "leads";
  } else if (format === "events") {
    const { recentEvents } = await import("@/lib/db/events");
    const events = await recentEvents(5000);
    csv = toCsv(
      ["occurred_at", "name", "path", "channel", "conversion", "device"],
      events.map((event) => [
        new Date(event.occurred_at * 1000).toISOString(),
        event.name,
        event.path,
        event.channel,
        event.conversion,
        event.device_category,
      ])
    );
    filename = "events";
  } else {
    return NextResponse.json({ error: "Unknown export format." }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
