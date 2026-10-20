"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Runs the technical SEO audit and reloads the page with the new results.
 *
 * The audit is a real crawl of the site's own pages, so it takes a moment and
 * reports honestly when it cannot reach the site.
 */
export function SeoAuditRunner() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    if (running) return;
    setRunning(true);
    setMessage("Checking the public pages…");

    try {
      const response = await fetch("/api/admin/seo/audit", { method: "POST" });
      const body = (await response.json().catch(() => null)) as {
        pagesChecked?: number;
        errors?: number;
        warnings?: number;
        infos?: number;
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "The audit could not be completed.");
        return;
      }

      setMessage(
        `Checked ${body?.pagesChecked ?? 0} page(s): ${body?.errors ?? 0} error(s), ${body?.warnings ?? 0} warning(s), ${body?.infos ?? 0} informational.`
      );
      router.refresh();
    } catch {
      setMessage("The audit could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="rounded-sm bg-accent-ink px-3 py-1.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-accent-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? "Running…" : "Run audit"}
      </button>
      {message ? (
        <p role="status" className="max-w-xs text-right text-[0.75rem] text-muted-text">
          {message}
        </p>
      ) : null}
    </div>
  );
}
