export function WorkingMethodSection() {
  return (
    <section
      className="py-24 md:py-32 px-6 max-w-7xl mx-auto"
    >
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-12"
        >
          WORKING METHOD
        </p>

        <h2 className="font-geist-sans text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight mb-12">
          Four-Stage Process
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div
                className="
                  w-12 h-12
                  rounded-full
                  bg-accent-primary/10
                  flex items-center justify-center
                  flex-shrink-0
                "
              >
                <svg
                  className="w-6 h-6 text-accent-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </div>
              <span className="text-accent-secondary text-sm font-medium uppercase tracking-wider">DIAGNOSE</span>
            </div>

            <h3 className="font-geist-sans text-2xl font-bold mb-4">01 - Diagnose</h3>
            <p className="text-muted/60 text-base leading-relaxed mb-4">
              Understand the business problem, offer, market, and objective. I research
              the landscape, identify constraints, and clarify what success looks like
              before committing resources.
            </p>
            <ul className="text-muted/60 text-sm space-y-2">
              <li>Business problem analysis</li>
              <li>Market & competitor research</li>
              <li>Objective clarification</li>
              <li>Offer assessment</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div
                className="
                  w-12 h-12
                  rounded-full
                  bg-accent-primary/10
                  flex items-center justify-center
                  flex-shrink-0
                "
              >
                <svg
                  className="w-6 h-6 text-accent-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="M8 14s1.5 2 4 2 4-2 4-2"
                  />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                </svg>
              </div>
              <span className="text-accent-secondary text-sm font-medium uppercase tracking-wider">STRATEGIZE</span>
            </div>

            <h3 className="font-geist-sans text-2xl font-bold mb-4">02 - Strategize</h3>
            <p className="text-muted/60 text-base leading-relaxed mb-4">
              Research audiences and competitors, define positioning, develop content
              pillars, and structure the campaign. Every decision is grounded in data
              and aligned with the business objective.
            </p>
            <ul className="text-muted/60 text-sm space-y-2">
              <li>Audience & competitor research</li>
              <li>Positioning & messaging</li>
              <li>Content pillars development</li>
              <li>Campaign structuring</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div
                className="
                  w-12 h-12
                  rounded-full
                  bg-accent-primary/10
                  flex items-center justify-center
                  flex-shrink-0
                "
              >
                <svg
                  className="w-6 h-6 text-accent-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-accent-secondary text-sm font-medium uppercase tracking-wider">PLAN</span>
            </div>

            <h3 className="font-geist-sans text-2xl font-bold mb-4">03 - Plan</h3>
            <p className="text-muted/60 text-base leading-relaxed mb-4">
              Align creative direction, media planning, budget, and measurement. I map
              out the creative assets, select the channels, set the budget, and define
              the KPIs that will guide optimization.
            </p>
            <ul className="text-muted/60 text-sm space-y-2">
              <li>Creative direction</li>
              <li>Media planning & channel mix</li>
              <li>Budget allocation</li>
              <li>Measurement framework</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div
                className="
                  w-12 h-12
                  rounded-full
                  bg-accent-primary/10
                  flex items-center justify-center
                  flex-shrink-0
                "
              >
                <svg
                  className="w-6 h-6 text-accent-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v3c0 6 8 10 8 10z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="text-accent-secondary text-sm font-medium uppercase tracking-wider">OPTIMIZE</span>
            </div>

            <h3 className="font-geist-sans text-2xl font-bold mb-4">04 - Optimize</h3>
            <p className="text-muted/60 text-base leading-relaxed mb-4">
              Monitor available signals, identify opportunities, and improve based on
              evidence. I track performance data, identify underperforming elements,
              and iterate systematically.
            </p>
            <ul className="text-muted/60 text-sm space-y-2">
              <li>Performance monitoring</li>
              <li>Opportunity identification</li>
              <li>Data-driven iteration</li>
              <li>Continuous improvement</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
