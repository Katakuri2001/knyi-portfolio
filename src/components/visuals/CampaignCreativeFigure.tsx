/**
 * Campaign creative study — abstract advertising layout plate.
 *
 * Studies the *shape* of a social campaign: three creative frames at the ratios
 * that matter (4:5 feed, 1:1, 9:16 story), each with an abstract mark, a
 * headline bar and a caption bar.
 *
 * It deliberately contains no numbers, no dates, no platform chrome and no
 * results. It is an editorial illustration of creative format, not a screenshot
 * and not evidence of anything.
 *
 * REPLACE WITH REAL WORK: drop campaign creatives at
 * `public/images/campaign-creative-study.jpg` and render them here instead.
 */
export function CampaignCreativeFigure({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 1100"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="cc-bed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00050a" />
          <stop offset="58%" stopColor="#021a35" />
          <stop offset="100%" stopColor="#021f3f" />
        </linearGradient>
        <radialGradient id="cc-glow" cx="24%" cy="8%" r="70%">
          <stop offset="0%" stopColor="#36ecdf" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#36ecdf" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cc-fill-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#36ecdf" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#36ecdf" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="cc-fill-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6e9ee" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#e6e9ee" stopOpacity="0.02" />
        </linearGradient>
        <pattern id="cc-hatch" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="9" stroke="#36ecdf" strokeOpacity="0.5" strokeWidth="2" />
        </pattern>
      </defs>

      <rect width="900" height="1100" fill="url(#cc-bed)" />
      <rect width="900" height="1100" fill="url(#cc-glow)" />

      <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
        <line x1="0" y1="180" x2="900" y2="180" />
        <line x1="0" y1="880" x2="900" y2="880" />
        <line x1="70" y1="0" x2="70" y2="1100" />
        <line x1="830" y1="0" x2="830" y2="1100" />
      </g>

      {/* — 4:5 feed frame — */}
      <g transform="translate(140 232)">
        <rect width="330" height="412" fill="url(#cc-fill-b)" stroke="#ffffff" strokeOpacity="0.22" />
        <rect width="330" height="30" fill="#ffffff" fillOpacity="0.05" />
        <circle cx="22" cy="15" r="5" fill="#36ecdf" fillOpacity="0.85" />
        <rect x="40" y="11" width="66" height="8" rx="4" fill="#ffffff" fillOpacity="0.22" />

        <circle cx="165" cy="168" r="86" fill="none" stroke="#36ecdf" strokeOpacity="0.7" strokeWidth="1.5" />
        <path d="M79 168 A86 86 0 0 1 251 168" stroke="#36ecdf" strokeWidth="4" strokeLinecap="round" />
        <path d="M165 82 A86 86 0 0 1 251 168" stroke="#36ecdf" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="118" y="284" width="94" height="7" fill="#36ecdf" fillOpacity="0.8" />

        <rect x="28" y="318" width="196" height="13" rx="6.5" fill="#ffffff" fillOpacity="0.3" />
        <rect x="28" y="344" width="256" height="13" rx="6.5" fill="#ffffff" fillOpacity="0.16" />
        <rect x="28" y="370" width="140" height="13" rx="6.5" fill="#ffffff" fillOpacity="0.16" />
      </g>

      {/* — 1:1 frame — */}
      <g transform="translate(510 232)">
        <rect width="250" height="250" fill="url(#cc-fill-a)" />
        <rect width="250" height="250" fill="url(#cc-hatch)" opacity="0.28" />
        <rect x="24" y="24" width="202" height="202" fill="#00050a" fillOpacity="0.42" />
        <path d="M52 186 L108 118 L146 152 L198 74" fill="none" stroke="#36ecdf" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M172 74 h26 v26" fill="none" stroke="#36ecdf" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* — 9:16 story frame — */}
      <g transform="translate(510 512)">
        <rect width="250" height="368" fill="url(#cc-fill-b)" stroke="#ffffff" strokeOpacity="0.22" />
        <rect x="20" y="20" width="210" height="210" fill="url(#cc-fill-a)" />
        <g fill="#00050a" fillOpacity="0.5">
          <rect x="20" y="256" width="164" height="12" rx="6" />
          <rect x="20" y="280" width="210" height="12" rx="6" opacity="0.6" />
          <rect x="20" y="304" width="126" height="12" rx="6" opacity="0.6" />
        </g>
        <rect x="20" y="332" width="92" height="5" fill="#36ecdf" fillOpacity="0.85" />
      </g>

      {/* Baseline rule + teal keyline. */}
      <line x1="70" y1="880" x2="830" y2="880" stroke="#36ecdf" strokeOpacity="0.55" strokeWidth="2" />
      <g stroke="#36ecdf" strokeOpacity="0.45" strokeWidth="2">
        <line x1="140" y1="880" x2="140" y2="900" />
        <line x1="470" y1="880" x2="470" y2="900" />
        <line x1="760" y1="880" x2="760" y2="900" />
      </g>
    </svg>
  );
}