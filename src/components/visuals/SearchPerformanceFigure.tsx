/**
 * Search visibility figure — abstract SERP rows plus a rising impression band.
 *
 * Placed beside the "currently learning" list, where SEO fundamentals are
 * documented as a learning area. It is captioned on the page as an illustrative
 * diagram, and it carries no ranking positions, no impression counts and no
 * date range, so it cannot be read as a client result.
 */
export function SearchPerformanceFigure({ className = "" }: { className?: string }) {
  const rows = [
    { w: 210, a: 128, b: 74 },
    { w: 186, a: 96, b: 58 },
    { w: 202, a: 152, b: 66 },
    { w: 158, a: 82, b: 48 },
  ];

  return (
    <svg
      viewBox="0 0 760 400"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="spf-bed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#021f3f" />
          <stop offset="100%" stopColor="#00050a" />
        </linearGradient>
        <linearGradient id="spf-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#36ecdf" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#36ecdf" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="760" height="400" fill="url(#spf-bed)" />

      {/* Search field. */}
      <rect x="40" y="40" width="330" height="42" rx="21" fill="#ffffff" fillOpacity="0.07" stroke="#ffffff" strokeOpacity="0.2" />
      <circle cx="68" cy="61" r="8" fill="none" stroke="#36ecdf" strokeWidth="2" />
      <line x1="74" y1="67" x2="82" y2="75" stroke="#36ecdf" strokeWidth="2" strokeLinecap="round" />
      <rect x="98" y="57" width="118" height="8" rx="4" fill="#ffffff" fillOpacity="0.26" />
      <circle cx="336" cy="61" r="9" fill="#36ecdf" fillOpacity="0.18" />

      {/* Result rows — title bar, url bar, description bars. */}
      <g>
        {rows.map((row, i) => (
          <g key={i} transform={`translate(40 ${118 + i * 62})`}>
            <rect width={row.w} height="13" rx="6.5" fill="#ffffff" fillOpacity={0.4 - i * 0.07} />
            <rect y="20" width={row.a} height="8" rx="4" fill="#36ecdf" fillOpacity={0.55 - i * 0.1} />
            <rect y="36" width={row.b} height="7" rx="3.5" fill="#ffffff" fillOpacity="0.16" />
          </g>
        ))}
      </g>

      {/* Visibility band. */}
      <g transform="translate(430 60)">
        <line x1="0" y1="290" x2="290" y2="290" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1" />
        <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1">
          {[70, 140, 210].map((y) => (
            <line key={y} x1="0" y1={y} x2="290" y2={y} />
          ))}
        </g>
        <path
          d="M0 250 C60 250 70 206 118 196 C170 184 180 130 226 118 C262 108 278 78 290 60 L290 290 L0 290 Z"
          fill="url(#spf-area)"
        />
        <path
          d="M0 250 C60 250 70 206 118 196 C170 184 180 130 226 118 C262 108 278 78 290 60"
          fill="none"
          stroke="#36ecdf"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="290" cy="60" r="5" fill="#36ecdf" />
      </g>
    </svg>
  );
}