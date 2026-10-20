/**
 * Campaign structure — an abstract plan diagram.
 *
 * A hub-and-spoke of the five decisions a campaign plan has to settle:
 * objective, audience, creative, budget, measurement. All five terms come from
 * the documented method; none is a result.
 *
 * This replaced an earlier ascending-bars figure. A rising bar ramp is a
 * performance story, and an unlabelled one still reads as "this went up" —
 * exactly the implication the case studies must not carry. The structure
 * diagram makes no claim at all.
 *
 * REPLACE WITH REAL WORK: drop a campaign planning sheet or brief extract at
 * `public/images/campaign-structure-study.jpg` and render it here instead.
 */
const HUB = { x: 360, y: 250, r: 74 };

const NODES = [
  { label: "Objective", side: "left", y: 90 },
  { label: "Audience", side: "left", y: 250 },
  { label: "Creative", side: "left", y: 410 },
  { label: "Budget", side: "right", y: 90 },
  { label: "Measure", side: "right", y: 250 },
] as const;

const PLATE_X = { left: 30, right: 490 } as const;
const PLATE_W = 200;
const PLATE_H = 52;

export function CampaignStructureFigure({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 500"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Faint column rules frame the diagram. */}
      <g stroke="var(--color-rule)" strokeOpacity="0.12" strokeWidth="1">
        <line x1="20" y1="0" x2="20" y2="500" />
        <line x1="700" y1="0" x2="700" y2="500" />
        <line x1="0" y1="170" x2="720" y2="170" />
        <line x1="0" y1="330" x2="720" y2="330" />
      </g>

      {/* Branches first so the plates sit on top of them. */}
      <g stroke="var(--color-ink)" strokeOpacity="0.26" strokeWidth="1.5">
        {NODES.map((node) => {
          const endX = node.side === "left" ? PLATE_X.left + PLATE_W + 8 : PLATE_X.right - 8;
          return <line key={node.label} x1={HUB.x} y1={HUB.y} x2={endX} y2={node.y} />;
        })}
      </g>

      <g fill="var(--color-accent-ink)">
        {NODES.map((node) => {
          const cx = node.side === "left" ? PLATE_X.left + PLATE_W + 8 : PLATE_X.right - 8;
          return <circle key={node.label} cx={cx} cy={node.y} r="3.5" />;
        })}
      </g>

      {/* Node plates. */}
      {NODES.map((node) => {
        const x = PLATE_X[node.side];
        const y = node.y - PLATE_H / 2;
        return (
          <g key={node.label}>
            <rect
              x={x}
              y={y}
              width={PLATE_W}
              height={PLATE_H}
              fill="var(--color-surface)"
              stroke="var(--color-rule)"
              strokeOpacity="0.22"
            />
            <rect x={x} y={y} width="4" height={PLATE_H} fill="var(--color-accent-ink)" />
            <text
              x={x + 24}
              y={node.y + 6}
              fill="var(--color-foreground)"
              fontFamily="var(--font-geist-sans)"
              fontSize="18"
              fontWeight="500"
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* Hub. */}
      <g>
        <circle cx={HUB.x} cy={HUB.y} r={HUB.r} fill="var(--color-ink)" />
        <circle
          cx={HUB.x}
          cy={HUB.y}
          r={HUB.r}
          fill="none"
          stroke="var(--color-accent-primary)"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        <text
          x={HUB.x}
          y={HUB.y - 18}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="var(--font-geist-mono)"
          fontSize="11"
          letterSpacing="2.6"
        >
          PLAN
        </text>
        <text
          x={HUB.x}
          y={HUB.y + 4}
          textAnchor="middle"
          fill="var(--color-accent-primary)"
          fontFamily="var(--font-geist-mono)"
          fontSize="11"
          letterSpacing="2.2"
        >
          BEFORE
        </text>
        <text
          x={HUB.x}
          y={HUB.y + 26}
          textAnchor="middle"
          fill="var(--color-accent-primary)"
          fontFamily="var(--font-geist-mono)"
          fontSize="11"
          letterSpacing="2.2"
        >
          SPEND
        </text>
      </g>

      {/* Baseline keyline. */}
      <line
        x1="20"
        y1="476"
        x2="220"
        y2="476"
        stroke="var(--color-accent-ink)"
        strokeWidth="3"
      />
    </svg>
  );
}