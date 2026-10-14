import { Reveal } from "@/components/Reveal";

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="mb-8 text-sm font-medium uppercase tracking-widest text-accent-secondary">
            Independent Performance Marketer
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mb-6 font-geist-sans text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl">
            Diagnose First. Strategize Better. Optimize for Growth.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-foreground md:text-xl">
            I connect business objectives with audience research, content strategy,
            media planning, and performance measurement to help campaigns move
            with purpose.
          </p>
        </Reveal>

        <div className="grid gap-8 border-t border-border/50 pt-10 text-left md:grid-cols-3">
          {[
            {
              label: "Background",
              body: "Freelance content writing and Facebook marketing experience from 2023-2026, with a developing specialization in performance marketing.",
            },
            {
              label: "How I think",
              body: "Research-led approach. I always start by understanding the business problem, the audience, and the competitive landscape before developing strategy.",
            },
            {
              label: "What I value",
              body: "Strategic thinking, creative quality, and data-driven optimization. Results that serve the business objective.",
            },
          ].map((item) => (
            <Reveal key={item.label} delay={0.16}>
              <p className="font-method mb-2 text-xs uppercase tracking-[0.18em] text-accent-ink">
                {item.label}
              </p>
              <p className="text-muted-text">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}