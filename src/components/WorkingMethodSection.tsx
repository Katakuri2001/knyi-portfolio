import { Reveal } from "@/components/Reveal";

const STAGES = [
  {
    number: "01",
    title: "Diagnose",
    icon: (
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    ),
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
    <section
      id="approach"
      className="mx-auto max-w-7xl px-6 py-24 md:py-32"
    >
      <Reveal>
        <p className="font-method mb-6 text-xs uppercase tracking-[0.18em] text-accent-secondary">
          Working method
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <h2 className="mb-14 font-geist-sans text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl">
          Four-stage process
        </h2>
      </Reveal>

      <ol className="grid gap-x-12 gap-y-12 md:grid-cols-2">
        {STAGES.map((stage, index) => (
          <Reveal as="li" key={stage.number} delay={0.1 + index * 0.05}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent-ink/30 bg-accent-primary/10">
              <svg
                aria-hidden="true"
                className="h-6 w-6 text-accent-ink"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                {stage.icon}
              </svg>
            </div>

            <h3 className="mt-6 font-geist-sans text-xl font-bold">
              <span className="font-method mr-2 text-sm text-accent-ink">
                {stage.number}
              </span>
              {stage.title}
            </h3>

            <ul className="mt-4 space-y-3 text-muted-text">
              {stage.items.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-px w-3 flex-none bg-accent-ink/60"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}