"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RANGE_PRESETS } from "@/lib/date-range";

/**
 * The reporting-period control.
 *
 * The chosen period lives in the URL, so every page in the console reports on
 * the same window and a report can be shared as a link.
 */
export function DateRangePicker({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function apply(preset: string, customFrom?: string, customTo?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", preset);

    if (preset === "custom") {
      if (customFrom) params.set("from", customFrom);
      else params.delete("from");
      if (customTo) params.set("to", customTo);
      else params.delete("to");
    } else {
      params.delete("from");
      params.delete("to");
    }

    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Reporting period"
        className="flex flex-wrap border border-border"
      >
        {RANGE_PRESETS.map((preset) => {
          const active = current === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => apply(preset.key)}
              aria-pressed={active}
              className={[
                "px-3 py-1.5 text-[0.8125rem] transition-colors duration-150",
                active
                  ? "bg-accent-ink text-white"
                  : "bg-surface text-muted-text hover:bg-accent-ink/10 hover:text-foreground",
              ].join(" ")}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => apply("custom", from, to)}
          aria-pressed={current === "custom"}
          className={[
            "px-3 py-1.5 text-[0.8125rem] transition-colors duration-150",
            current === "custom"
              ? "bg-accent-ink text-white"
              : "bg-surface text-muted-text hover:bg-accent-ink/10 hover:text-foreground",
          ].join(" ")}
        >
          Custom
        </button>
      </div>

      {current === "custom" ? (
        <div className="flex items-center gap-2">
          <label htmlFor="range-from" className="sr-only">
            From date
          </label>
          <input
            id="range-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-[0.8125rem] text-foreground outline-none focus:border-accent-ink"
          />
          <span aria-hidden="true" className="text-muted-text">
            →
          </span>
          <label htmlFor="range-to" className="sr-only">
            To date
          </label>
          <input
            id="range-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-[0.8125rem] text-foreground outline-none focus:border-accent-ink"
          />
          <button
            type="button"
            onClick={() => apply("custom", from, to)}
            className="rounded-sm border border-border bg-surface px-3 py-1.5 text-[0.8125rem] text-foreground transition-colors hover:bg-accent-ink/10"
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
