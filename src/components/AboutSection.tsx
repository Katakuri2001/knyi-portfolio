import { Reveal } from "@/components/Reveal";

const PRINCIPLES = [
  {
    index: "01",
    label: "Background",
    body: "Freelance content writing and Facebook marketing experience from 2023-2026, with a developing specialization in performance marketing.",
  },
  {
    index: "02",
    label: "How I think",
    body: "Research-led approach. I always start by understanding the business problem, the audience, and the competitive landscape before developing strategy.",
  },
  {
    index: "03",
    label: "What I value",
    body: "Strategic thinking, creative quality, and data-driven optimization. Results that serve the business objective.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="section-lead scroll-mt-24 px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-secondary">
            <span className="h-px w-12 bg-accent-secondary/40" aria-hidden="true" />
            Background
          </p>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal delay={0.06} className="lg:col-span-7">
            <h2 className="text-title text-foreground">
              Diagnose First. Strategize Better.{" "}
              <span className="text-muted-text">Optimize for Growth.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
            <p className="text-lede text-muted-text">
              I connect business objectives with audience research, content
              strategy, media planning, and performance measurement to help
              campaigns move with purpose.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-px border-t border-border bg-border md:grid-cols-3">
          {PRINCIPLES.map((principle, i) => (
            <Reveal key={principle.index} delay={0.16 + i * 0.05}>
              <div className="h-full bg-background p-8">
                <p className="text-index mb-6 text-accent-ink/25">{principle.index}</p>
                <h3 className="text-eyebrow mb-4 text-foreground">
                  {principle.label}
                </h3>
                <p className="leading-relaxed text-muted-text">{principle.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}