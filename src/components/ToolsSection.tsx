export function ToolsSection() {
  return (
    <section
      className="py-24 md:py-32 bg-background px-6 max-w-7xl mx-auto"
    >
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-12"
        >
          TOOLS & CAPABILITIES
        </p>

        <h2 className="font-geist-sans text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight mb-12">
          Practical Tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PRACTICAL EXPOSURE */}
          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-6">Practical Exposure</h3>
            <ul className="space-y-3 text-muted/70 text-sm">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Meta Ads Manager
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                </svg>
                Canva
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3V22z" />
                </svg>
                Google Sheets
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M20 21v1a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v1" />
                </svg>
                ChatGPT
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <circle cx="6" cy="8.5" r="1" />
                  <circle cx="14" cy="8.5" r="1" />
                </svg>
                Facebook Marketing
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-.9-3.8 8.5 8.5 0 01-7.6-4.7A8.38 8.38 0 012 4.28a8.5 8.5 0 017.63-5.8 8.38 8.38 0 01.9-3.8 8.5 8.5 0 017.63 5.8z" />
                  <line x1="17" y1="3" x2="23" y2="3" />
                </svg>
                Meta Pixel
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M12 2v2m0 16v2m6-8h-16m8 8h-16" />
                  <circle cx="9" cy="9" r="3" />
                  <circle cx="15" cy="9" r="3" />
                  <line x1="18" y1="12" x2="18.01" y2="12" />
                </svg>
                UTM parameters
              </li>
            </ul>
          </div>

          {/* CURRENTLY LEARNING */}
          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-6">Currently Learning</h3>
            <ul className="space-y-3 text-muted/70 text-sm">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary/50 mt-0.5 flex-shrink-0 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-.9-3.8 8.5 8.5 0 01-7.6-4.7A8.38 8.38 0 012 4.28a8.5 8.5 0 017.63-5.8 8.38 8.38 0 01.9-3.8 8.5 8.5 0 017.63 5.8z" />
                  <line x1="17" y1="3" x2="23" y2="3" />
                </svg>
                GA4
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary/50 mt-0.5 flex-shrink-0 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <circle cx="6" cy="8.5" r="1" />
                  <circle cx="14" cy="8.5" r="1" />
                </svg>
                GTM
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary/50 mt-0.5 flex-shrink-0 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M20 21v1a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v1" />
                </svg>
                Google Ads / SEM
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary/50 mt-0.5 flex-shrink-0 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M2 3l6 6l6-6" />
                  <path d="M14 3l6 6l-6 6" />
                  <path d="M10 3l-6 6l6 6" />
                </svg>
                TikTok Ads
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-accent-primary/50 mt-0.5 flex-shrink-0 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2M12 2a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4M6 8a2 2 0 002 2 2 2 0 002-2 2 2 0 00-2-2M6 8a2 2 0 002 2 2 2 0 002-2 2 2 0 00-2-2" />
                </svg>
                SEO fundamentals
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
