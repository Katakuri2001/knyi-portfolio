/**
 * Reporting periods.
 *
 * Every range in the console is computed the same way, in **UTC**, and every
 * label says so. A period boundary that moves with the viewer's timezone would
 * make two dashboards disagree about the same day, which is worse than any
 * timezone being slightly wrong.
 *
 * The period is carried in the URL (`?range=28d&from=…&to=…`), so a report can
 * be shared and reloaded exactly as it was seen.
 */

export const RANGE_PRESETS = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "28d", label: "Last 28 days", days: 28 },
  { key: "90d", label: "Last 90 days", days: 90 },
] as const;

export type RangePresetKey = (typeof RANGE_PRESETS)[number]["key"] | "custom";

export type DateRange = {
  /** Unix seconds, inclusive. */
  from: number;
  /** Unix seconds, inclusive — the end of the final day. */
  to: number;
  preset: RangePresetKey;
  /** Human label, e.g. "Last 28 days (UTC)". */
  label: string;
  /** The previous equivalent period, for comparisons. */
  previous: { from: number; to: number };
};

const DAY = 86400;

function startOfUtcDay(seconds: number): number {
  return Math.floor(seconds / DAY) * DAY;
}

/**
 * Resolves a range from URL parameters.
 *
 * `range` selects a preset; `from` and `to` (YYYY-MM-DD) override it for a
 * custom period. An unparseable custom range falls back to the last 28 days
 * rather than erroring — a bad link should still show a useful page.
 */
export function resolveRange(
  params: {
    range?: string | null;
    from?: string | null;
    to?: string | null;
  },
  nowSeconds: number = Math.floor(Date.now() / 1000)
): DateRange {
  const todayStart = startOfUtcDay(nowSeconds);
  const todayEnd = todayStart + DAY - 1;

  const preset = params.range ?? "28d";

  if (preset === "custom") {
    const from = parseDay(params.from);
    const to = parseDay(params.to);
    if (from !== null && to !== null && from <= to) {
      const toEnd = to + DAY - 1;
      const span = toEnd - from;
      return {
        from,
        to: toEnd,
        preset: "custom",
        label: `${params.from} → ${params.to} (UTC)`,
        previous: { from: from - span - 1, to: from - 1 },
      };
    }
  }

  const matched = RANGE_PRESETS.find((item) => item.key === preset);
  const days = matched?.days ?? 28;

  const from = todayStart - (days - 1) * DAY;
  const to = todayEnd;
  const label = matched?.label ?? "Last 28 days";

  return {
    from,
    to,
    preset: (matched?.key ?? "28d") as RangePresetKey,
    label: `${label} (UTC)`,
    previous: { from: from - days * DAY, to: from - 1 },
  };
}

function parseDay(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
}

/** Formats a unix timestamp as a UTC date. */
export function formatDay(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

/** Formats a unix timestamp as a readable UTC date and time. */
export function formatDateTime(seconds: number): string {
  return `${new Date(seconds * 1000).toISOString().slice(0, 10)} ${new Date(
    seconds * 1000
  )
    .toISOString()
    .slice(11, 16)} UTC`;
}

/** Percentage change, or `null` when the comparison is not meaningful. */
export function percentChange(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return null;
  return (current - previous) / previous;
}

/**
 * Whether a comparison is worth stating.
 *
 * A percentage change on a handful of sessions is noise. Below the threshold
 * the console says "not enough data" instead of implying a trend.
 */
export const MIN_COMPARISON_SAMPLE = 30;

export function comparisonIsMeaningful(
  current: number | null,
  previous: number | null
): boolean {
  if (current === null || previous === null) return false;
  if (previous === 0) return false;
  return current >= MIN_COMPARISON_SAMPLE || previous >= MIN_COMPARISON_SAMPLE;
}
