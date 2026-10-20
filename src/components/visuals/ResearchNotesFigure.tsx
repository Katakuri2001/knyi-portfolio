/**
 * Research notes — an abstract stack of working documents.
 *
 * Layered sheets with annotation rules and one highlighted callout: the shape
 * of a research desk. Distinct in structure from the segmentation grid used on
 * the supporting case study, so the two never read as the same picture.
 *
 * Contains no legible text and no figures — it is a texture, not a record.
 */
const SHEETS = [
  { x: 22, y: 0, w: 296, h: 376, rotate: -6 },
  { x: 164, y: 42, w: 296, h: 376, rotate: 3 },
  { x: 300, y: 20, w: 296, h: 376, rotate: -2 },
];

export function ResearchNotesFigure({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 620 460"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {SHEETS.map((sheet, i) => (
        <g
          key={sheet.x}
          transform={`rotate(${sheet.rotate} ${sheet.x + sheet.w / 2} ${sheet.y + sheet.h / 2})`}
        >
          <rect
            x={sheet.x}
            y={sheet.y}
            width={sheet.w}
            height={sheet.h}
            fill="var(--color-surface)"
            stroke="var(--color-rule)"
            strokeOpacity="0.18"
          />
          <rect
            x={sheet.x}
            y={sheet.y}
            width={sheet.w}
            height="6"
            fill={i === 2 ? "var(--color-accent-ink)" : "var(--color-ink)"}
            fillOpacity={i === 2 ? 0.85 : 0.22}
          />
          {/* Annotation rules. */}
          <g fill="var(--color-ink)">
            <rect x={sheet.x + 26} y={sheet.y + 44} width={sheet.w - 52} height="11" fillOpacity="0.28" />
            <rect x={sheet.x + 26} y={sheet.y + 68} width={sheet.w - 92} height="11" fillOpacity="0.14" />
          </g>
          <g fill="var(--color-ink)" fillOpacity="0.09">
            <rect x={sheet.x + 26} y={sheet.y + 106} width="150" height="7" />
            <rect x={sheet.x + 26} y={sheet.y + 122} width="196" height="7" />
            <rect x={sheet.x + 26} y={sheet.y + 138} width="118" height="7" />
            <rect x={sheet.x + 26} y={sheet.y + 168} width="172" height="7" />
            <rect x={sheet.x + 26} y={sheet.y + 184} width="140" height="7" />
          </g>

          {/* A small matrix on each sheet. */}
          <g stroke="var(--color-ink)" strokeOpacity="0.18" fill="none">
            <rect x={sheet.x + 26} y={sheet.y + 222} width="96" height="72" />
            <rect x={sheet.x + 130} y={sheet.y + 222} width="96" height="72" />
            <line x1={sheet.x + 74} y1={sheet.y + 222} x2={sheet.x + 74} y2={sheet.y + 294} />
            <line x1={sheet.x + 178} y1={sheet.y + 258} x2={sheet.x + 178} y2={sheet.y + 294} />
          </g>
          <rect
            x={sheet.x + 74}
            y={sheet.y + 258}
            width="52"
            height="36"
            fill="var(--color-accent-primary)"
            fillOpacity={i === 2 ? 0.85 : 0.3}
          />

          {/* Callout flag on the top sheet. */}
          {i === 2 ? (
            <g>
              <path
                d={`M${sheet.x + 244} ${sheet.y + 330} h34 v-16 l18 18 -18 18 v-16 h-34 z`}
                fill="var(--color-accent-ink)"
              />
            </g>
          ) : null}
        </g>
      ))}

      {/* Underline keyline. */}
      <line x1="40" y1="436" x2="196" y2="436" stroke="var(--color-accent-ink)" strokeWidth="3" />
    </svg>
  );
}