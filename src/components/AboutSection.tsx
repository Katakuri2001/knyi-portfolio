export function AboutSection() {
  return (
    <section
      id="about"
      className="py-24 md:py-32 bg-background px-6 max-w-7xl mx-auto"
    >
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-8"
        >
          INDEPENDENT PERFORMANCE MARKETER
        </p>

        <h2 className="font-geist-sans text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight mb-6">
          Diagnose First. Strategize Better. Optimize for Growth.
        </h2>

        <p className="text-foreground text-lg md:text-xl leading-relaxed mb-8">
          I connect business objectives with audience research, content strategy,
          media planning, and performance measurement to help campaigns move
          with purpose.
        </p>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 justify-center">
          <div>
            <p className="font-medium text-accent-ink text-sm uppercase tracking-wider mb-2">BACKGROUND</p>
            <p className="text-muted-text text-sm">
              Freelance content writing and Facebook marketing experience from 2023-2026,
              with a developing specialization in performance marketing.
            </p>
          </div>
          <div>
            <p className="font-medium text-accent-ink text-sm uppercase tracking-wider mb-2">HOW I THINK</p>
            <p className="text-muted-text text-sm">
              Research-led approach. I always start by understanding the business
              problem, the audience, and the competitive landscape before developing
              strategy.
            </p>
          </div>
          <div>
            <p className="font-medium text-accent-ink text-sm uppercase tracking-wider mb-2">WHAT I VALUE</p>
            <p className="text-muted-text text-sm">
              Strategic thinking, creative quality, and data-driven optimization.
              Results that serve the business objective.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
