/**
 * Audience segmentation grid — abstract research plate.
 *
 * A matrix of cells with three highlighted bands, bracketed as two segments.
 * Purely structural: no demographic labels, no sizes, no percentages. It
 * illustrates how audience research is organised, and asserts nothing about a
 * specific campaign.
 */
export function AudienceResearchFigure({ className = "" }: { className?: string }) {
  const cols = 6;
  const rows = 5;
  const cell = 84;
  const gap = 10;
  const ox = 44;
  const oy = 58;
  // Deterministic highlight pattern — three cells in each of two bands.
  const hot = new Set([7, 8, 14, 20, 21, 26]);

  return (
    <svg
      viewBox="0 0 620 540"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Segment brackets. */}
      <g stroke="var(--color-ink)" strokeOpacity="0.35" strokeWidth="1.5">
        <path d="M24 128 V74 h10" fill="none" />
        <path d="M24 128 V258 h10" fill="none" />
        <path d="M24 300 V330 h10" fill="none" />
      </g>

      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const idx = r * cols + c;
          const isHot = hot.has(idx);
          return (
            <rect
              key={idx}
              x={ox + c * (cell + gap)}
              y={oy + r * (cell + gap)}
              width={cell}
              height={cell}
              fill={isHot ? "var(--color-accent-primary)" : "var(--color-ink)"}
              fillOpacity={isHot ? 0.85 : 0.05 + ((idx * 7) % 5) * 0.022}
              stroke={isHot ? "var(--color-accent-ink)" : "var(--color-rule)"}
              strokeOpacity={isHot ? 0.9 : 0.16}
              strokeWidth="1"
            />
          );
        })
      )}

      {/* Row rules extending past the matrix. */}
      <g stroke="var(--color-rule)" strokeOpacity="0.14" strokeWidth="1">
        {[0, 1, 2, 3, 4].map((r) => (
          <line
            key={r}
            x1={ox}
            y1={oy + r * (cell + gap) + cell / 2}
            x2="586"
            y2={oy + r * (cell + gap) + cell / 2}
          />
        ))}
      </g>

      <rect x="44" y="502" width="96" height="3" fill="var(--color-accent-ink)" />
    </svg>
  );
}