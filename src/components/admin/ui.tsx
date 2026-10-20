import type { ReactNode } from "react";

/**
 * Console UI primitives.
 *
 * Deliberately restrained: the console is a working tool, so the hierarchy
 * comes from type, rules and spacing rather than from panels floating in
 * glass. It uses the same tokens as the public site, so it reads as part of
 * the same product.
 */

/* ---------------------------------------------------------------------------
   Layout
   --------------------------------------------------------------------------- */

export function PageHeader({
  index,
  title,
  purpose,
  objective,
  actions,
}: {
  index: string;
  title: string;
  purpose: string;
  objective?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-rule pt-3">
        <span className="text-meta font-medium tracking-[0.18em] text-accent-ink">
          {index}
        </span>
        <span className="text-eyebrow text-accent-ink">{objective}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title text-foreground">{title}</h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-text">
            {purpose}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-card ${className}`}>
      {title || action ? (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            {title ? (
              <h2 className="text-eyebrow text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-text">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="flex items-center gap-3">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PanelGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}) {
  const map = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  } as const;

  return (
    <div className={`grid gap-4 ${map[columns]}`}>{children}</div>
  );
}

/* ---------------------------------------------------------------------------
   Data display
   --------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  comparison,
  comparisonLabel,
  note,
  unavailable = false,
  unavailableReason,
}: {
  label: string;
  value: string | number | null;
  /** Change against the previous equivalent period, as a fraction (0.18 = +18%). */
  comparison?: number | null;
  comparisonLabel?: string;
  note?: string;
  unavailable?: boolean;
  unavailableReason?: string;
}) {
  const hasComparison =
    comparison !== null &&
    comparison !== undefined &&
    Number.isFinite(comparison);

  return (
    <div className="glass-card p-5">
      <p className="text-meta text-muted-text">{label}</p>

      {unavailable ? (
        <>
          <p className="mt-3 text-subtitle text-muted-text">Not configured</p>
          {unavailableReason ? (
            <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-text">
              {unavailableReason}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mt-3 font-geist-sans text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-text">
            {hasComparison ? (
              <span
                className={[
                  "font-medium",
                  comparison > 0
                    ? "text-accent-ink"
                    : comparison < 0
                      ? "text-muted-text"
                      : "text-muted-text",
                ].join(" ")}
              >
                {comparison > 0 ? "+" : ""}
                {Math.round(comparison * 100)}%
              </span>
            ) : null}
            {hasComparison && comparisonLabel ? ` ${comparisonLabel}` : null}
            {!hasComparison && comparisonLabel ? comparisonLabel : null}
            {note ? ` · ${note}` : null}
          </p>
        </>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-border px-6 py-10 text-center">
      <p className="text-[0.9375rem] font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-[0.875rem] leading-relaxed text-muted-text">
        {body}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "error" | "muted" | "info";
  children: ReactNode;
}) {
  const map = {
    ok: "border-accent-ink/45 text-accent-ink",
    warn: "border-amber-700/50 text-amber-800",
    error: "border-red-800/50 text-red-900",
    muted: "border-border text-muted-text",
    info: "border-sky-800/45 text-sky-900",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide uppercase ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/** A definition row — the console's equivalent of a ledger line. */
export function DefRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-meta shrink-0 text-muted-text">{label}</dt>
      <dd className="text-right text-[0.875rem] text-foreground">{children}</dd>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Charts
   --------------------------------------------------------------------------- */

export type SeriesPoint = { date: string; value: number };

/**
 * A trend line.
 *
 * Hand-drawn SVG rather than a chart library: no dependency, no bundle cost,
 * and the visual language stays on-brand. The values are exposed in a table
 * alternative for screen readers, and the axis is labelled with the real
 * maximum rather than a decorative one.
 */
export function TrendChart({
  data,
  height = 160,
  label,
  valueSuffix = "",
}: {
  data: SeriesPoint[];
  height?: number;
  label: string;
  valueSuffix?: string;
}) {
  if (data.length === 0) {
    return (
      <EmptyState title="No data in this period" body="Nothing was recorded for the selected dates." />
    );
  }

  const width = 720;
  const padding = { top: 12, right: 8, bottom: 24, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((point) => point.value), 1);
  const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const x = (index: number) => padding.left + index * step;
  const y = (value: number) =>
    padding.top + plotHeight - (value / max) * plotHeight;

  const line = data
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`)
    .join(" ");

  const area = `${line} L${x(data.length - 1).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} L${padding.left},${(padding.top + plotHeight).toFixed(1)} Z`;

  const gridValues = [0, Math.round(max / 2), max];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${label}. ${data.length} points, maximum ${max}${valueSuffix}.`}
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(value)}
              y2={y(value)}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={y(value) + 4}
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
              fillOpacity="0.55"
              className="font-geist-mono"
            >
              {value}
            </text>
          </g>
        ))}

        <path d={area} fill="var(--color-accent-ink)" fillOpacity="0.08" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-accent-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <text
          x={padding.left}
          y={height - 6}
          fontSize="11"
          fill="currentColor"
          fillOpacity="0.55"
          className="font-geist-mono"
        >
          {data[0]?.date}
        </text>
        <text
          x={width - padding.right}
          y={height - 6}
          textAnchor="end"
          fontSize="11"
          fill="currentColor"
          fillOpacity="0.55"
          className="font-geist-mono"
        >
          {data[data.length - 1]?.date}
        </text>
      </svg>

      <details className="mt-3">
        <summary className="cursor-pointer text-[0.75rem] text-muted-text">
          View as a table
        </summary>
        <div className="mt-2 max-h-56 overflow-auto">
          <table className="w-full text-left text-[0.8125rem]">
            <thead className="sticky top-0 bg-[rgb(252_253_254)]">
              <tr className="border-b border-border text-meta text-muted-text">
                <th className="py-1.5 pr-4 font-medium">Date</th>
                <th className="py-1.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.date} className="border-b border-border/60">
                  <td className="py-1 pr-4 text-muted-text">{point.date}</td>
                  <td className="py-1 text-right text-foreground">
                    {point.value}
                    {valueSuffix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export type BarDatum = { label: string; value: number; secondary?: number };

/** A horizontal bar chart — clearer than a pie for ranked comparison. */
export function BarChart({
  data,
  label,
  valueSuffix = "",
  secondaryLabel,
}: {
  data: BarDatum[];
  label: string;
  valueSuffix?: string;
  secondaryLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <EmptyState title="No data in this period" body="Nothing was recorded for the selected dates." />
    );
  }

  const max = Math.max(...data.map((datum) => datum.value), 1);

  return (
    <figure>
      <ul className="space-y-3" aria-label={label}>
        {data.map((datum) => (
          <li key={datum.label}>
            <div className="flex items-baseline justify-between gap-4 text-[0.875rem]">
              <span className="truncate text-foreground">{datum.label}</span>
              <span className="flex-none font-geist-mono text-[0.8125rem] text-muted-text">
                {datum.value}
                {valueSuffix}
                {datum.secondary !== undefined ? (
                  <span className="ml-2 text-accent-ink">{datum.secondary}</span>
                ) : null}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-border/50">
              <div
                className="h-full bg-accent-ink"
                style={{ width: `${(datum.value / max) * 100}%` }}
              />
            </div>
            {datum.secondary !== undefined && secondaryLabel ? (
              <p className="mt-1 text-[0.6875rem] text-muted-text">
                {secondaryLabel}: {datum.secondary}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </figure>
  );
}
