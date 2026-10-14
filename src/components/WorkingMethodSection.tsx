import { Reveal } from "@/components/Reveal";

const STAGES = [
  {
    number: "01",
    title: "Diagnose",
    icon: <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />,
    items: [
      "Business problem analysis",
      "Market & competitor research",
      "Objective clarification",
      "Offer assessment",
    ],
  },
  {
    number: "02",
    title: "Strategize",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" strokeLinejoin="round" />
      </>
    ),
    items: [
      "Audience & competitor research",
      "Positioning & messaging",
      "Content pillars development",
      "Campaign structuring",
    ],
  },
  {
    number: "03",
    title: "Plan",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      </>
    ),
    items: [
      "Creative direction",
      "Media planning & channel mix",
      "Budget allocation",
      "Measurement framework",
    ],
  },
  {
    number: "04",
    title: "Optimize",
    icon: (
      <>
        <path d="M4 17l5-5 4 3 7-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    items: [
      "Performance monitoring",
      "Opportunity identification",
      "Data-driven iteration",
      "Continuous improvement",
    ],
  },
];

export function WorkingMethodSection() {
  return (
    <section id="approach" className="section-lead scroll-mt-24 px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-secondary">
            <span className="h-px w-12 bg-accent-secondary/40" aria-hidden="true" />
            Working method
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="text-title max-w-4xl text-foreground">
            Four stages,
            <br />
            <span className="text-muted-text">in order.</span>
          </h2>
        </Reveal>

        {/* Stages as connected steps: the vertical rule is the through-line,
            so the process reads as one sequence rather than four loose blocks. */}
        <ol className="mt-20 grid gap-x-10 gap-y-14 md:grid-cols-2">
          {STAGES.map((stage, i) => (
            <Reveal as="li" key={stage.number} delay={0.12 + i * 0.05}>
              <div className="relative border-t border-border pt-8">
                <div className="flex items-baseline justify-between gap-6">
                  <span className="text-index text-accent-ink/30">
                    {stage.number}
                  </span>
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-accent-ink/25 transition-colors duration-300 group-hover:border-accent-ink/60">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 text-accent-ink"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                    >
                      {stage.icon}
                    </svg>
                  </div>
                </div>

                <h3 className="mt-6 font-geist-sans text-3xl font-bold tracking-tight text-foreground">
                  {stage.title}
                </h3>

                <ul className="mt-6 space-y-3 text-muted-text">
                  {stage.items.map((item) => (
                    <li key={item} className="flex gap-3 leading-relaxed">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-px w-3 flex-none bg-accent-ink/50"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}