"use client";

import { useState } from "react";

/**
 * CSV exports.
 *
 * The export is fetched with the session cookie, so it is a real download
 * rather than a client-side reconstruction of the data. The message body is
 * only included when the owner asks for it, because it is the one field in a
 * lead that can contain anything.
 */
export function ReportExports({ exportQuery }: { exportQuery: string }) {
  const [includeMessages, setIncludeMessages] = useState(false);

  function href(format: "leads" | "events") {
    const params = new URLSearchParams(exportQuery);
    params.set("format", format);
    if (format === "leads" && includeMessages) {
      params.set("includeMessages", "true");
    }
    return `/api/admin/reports/export?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <div className="flex flex-wrap gap-3">
        <a
          href={href("leads")}
          className="rounded-sm bg-accent-ink px-4 py-2 text-[0.875rem] font-medium text-white transition-colors hover:bg-accent-ink/85"
        >
          Download enquiries (CSV)
        </a>
        <a
          href={href("events")}
          className="rounded-sm border border-border bg-surface px-4 py-2 text-[0.875rem] text-foreground transition-colors hover:bg-accent-ink/10"
        >
          Download events (CSV)
        </a>
      </div>

      <label className="flex items-center gap-2.5 text-[0.8125rem] text-foreground">
        <input
          type="checkbox"
          checked={includeMessages}
          onChange={(event) => setIncludeMessages(event.target.checked)}
          className="h-4 w-4 accent-[color:var(--color-accent-ink)]"
        />
        Include the message body in the enquiry export
      </label>

      <p className="text-[0.75rem] leading-relaxed text-muted-text">
        Exports use the same period as the report above. A value beginning with
        =, +, − or @ is escaped so a spreadsheet cannot execute it.
      </p>
    </div>
  );
}
