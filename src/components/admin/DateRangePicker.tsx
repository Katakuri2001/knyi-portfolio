"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RANGE_PRESETS } from "@/lib/date-range";

/**
 * The reporting-period control.
 *
 * The chosen period lives in the URL, so every page in the console reports on
 * the same window and a report can be shared as a link.
 *
 * The control is a glass trough with glass tabs inside it. The active tab is a
 * deep navy glass chip, so the state is carried by shape and contrast as well as
 * by colour.
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
        className="glass-bar flex flex-wrap rounded-xl p-1"
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
                "rounded-lg px-3 py-1.5 text-[0.8125rem] transition-all duration-200",
                active
                  ? "glass-primary font-medium"
                  : "text-muted-text hover:bg-white/50 hover:text-foreground",
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
            "rounded-lg px-3 py-1.5 text-[0.8125rem] transition-all duration-200",
            current === "custom"
              ? "glass-primary font-medium"
              : "text-muted-text hover:bg-white/50 hover:text-foreground",
          ].join(" ")}
        >
          Custom
        </button>
      </div>

      {current === "custom" ? (
        <div className="glass-surface flex items-center gap-2 rounded-xl p-1">
          <label htmlFor="range-from" className="sr-only">
            From date
          </label>
          <input
            id="range-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-lg bg-transparent px-2 py-1.5 text-[0.8125rem] text-foreground outline-none"
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
            className="rounded-lg bg-transparent px-2 py-1.5 text-[0.8125rem] text-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => apply("custom", from, to)}
            className="glass-primary rounded-lg px-3 py-1.5 text-[0.8125rem]"
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
