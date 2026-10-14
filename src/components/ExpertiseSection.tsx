import { Reveal } from "@/components/Reveal";

const CAPABILITIES = [
  {
    title: "Meta Ads & Media Buying",
    items: [
      "Campaign objectives & KPI planning",
      "Audience strategy & segmentation",
      "Media planning & channel selection",
      "Budget allocation & CPM optimization",
      "Creative testing direction",
      "Retargeting concepts",
      "CPM, CTR, CPC, CPA & ROAS analysis",
    ],
  },
  {
    title: "Content Strategy",
    items: [
      "Content pillars & angles",
      "Content calendars & planning",
      "Copywriting & messaging",
      "Audience-focused positioning",
      "Funnel planning & alignment",
      "Content & advertising alignment",
    ],
  },
  {
    title: "Marketing Analysis",
    items: [
      "Business & marketing objectives",
      "Audience research",
      "Competitor research",
      "Offer analysis",
      "Customer journey thinking",
      "Funnel strategy",
      "Problem identification",
    ],
  },
];

export function ExpertiseSection() {
  return (
    <section
      id="expertise"
      className="mx-auto max-w-7xl scroll-mt-16 px-6 py-24 md:py-32"
    >
      <Reveal>
        <p className="font-method mb-6 text-xs uppercase tracking-[0.18em] text-accent-secondary">
          Core capabilities
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <h2 className="mb-12 font-geist-sans text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl">
          What I do
        </h2>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((capability, index) => (
          <Reveal key={capability.title} delay={0.1 + index * 0.05}>
            <article className="h-full rounded-2xl border border-border/60 bg-white/70 p-6 transition-colors duration-300 hover:border-accent-ink/40 dark:bg-white/[0.04] md:p-8">
              <h3 className="mb-5 font-geist-sans text-lg font-bold">
                {capability.title}
              </h3>
              <ul className="space-y-3 text-muted-text">
                {capability.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-px w-3 flex-none bg-accent-ink/60"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}