import { Reveal } from "@/components/Reveal";

const CAPABILITIES = [
  {
    index: "01",
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
    index: "02",
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
    index: "03",
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
      className="section-body scroll-mt-24 bg-surface-sunken px-6"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-secondary">
            <span className="h-px w-12 bg-accent-secondary/40" aria-hidden="true" />
            Core capabilities
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <Reveal delay={0.06} className="lg:col-span-7">
            <h2 className="text-title text-foreground">What I do</h2>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
            <p className="text-muted-text leading-relaxed">
              Three connected disciplines. Campaigns rarely fail in one place
              alone, so the work usually spans all three.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px bg-border md:grid-cols-3">
          {CAPABILITIES.map((capability, i) => (
            <Reveal key={capability.index} delay={0.16 + i * 0.05}>
              <article className="group h-full bg-surface p-8 transition-colors duration-300 hover:bg-background md:p-10">
                <p className="text-index mb-8 text-accent-ink/25 transition-colors duration-300 group-hover:text-accent-ink/60">
                  {capability.index}
                </p>
                <h3 className="mb-8 font-geist-sans text-2xl font-bold leading-tight tracking-tight text-foreground">
                  {capability.title}
                </h3>
                <ul className="space-y-3.5 text-muted-text">
                  {capability.items.map((item) => (
                    <li key={item} className="flex gap-3 leading-relaxed">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-px w-3 flex-none bg-accent-ink/50 transition-colors duration-300 group-hover:bg-accent-ink"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}