"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Runs a live connection test for one integration.
 *
 * The test runs on the server and its result is what is displayed. A failure
 * shows the provider's own message — never a guess, and never a credential.
 */
export function IntegrationPanel({ integrationKey }: { integrationKey: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function test() {
    if (running) return;
    setRunning(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: integrationKey }),
      });

      const body = (await response.json().catch(() => null)) as {
        status?: string;
        message?: string | null;
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "The check could not be completed.");
        return;
      }

      setMessage(
        `${(body?.status ?? "unknown").replace(/_/g, " ")} — ${
          body?.message ?? ""
        }`
      );
      router.refresh();
    } catch {
      setMessage("The check could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={test}
        disabled={running}
        className="glass-surface rounded-lg px-3 py-1.5 text-[0.8125rem] text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? "Testing…" : "Test connection"}
      </button>
      {message ? (
        <p
          role="status"
          className="max-w-xs text-right text-[0.75rem] leading-relaxed text-muted-text"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
