import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { Reveal } from "@/components/Reveal";

export function HeroSection() {
  return (
    <section id="top" className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:pb-24 md:pt-32">
      <Reveal>
        <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-secondary">
          <span className="h-px w-12 bg-accent-secondary/40" aria-hidden="true" />
          Independent performance marketer
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <h1 className="text-display text-foreground">
          Diagnose
          <br />
          <span className="text-accent-ink">first.</span> Scale
          <br />
          with strategy.
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-12 border-t border-border pt-10 md:grid-cols-12 md:gap-8">
        <Reveal delay={0.12} className="md:col-span-4">
          <div className="flex flex-col gap-4 sm:flex-row md:flex-col md:items-start">
            <a
              className="rounded-full bg-cta px-7 py-3.5 font-geist-sans text-base font-medium text-on-cta transition-transform duration-200 hover:-translate-y-0.5"
              href="#campaigns"
            >
              Explore my work
            </a>
            <a
              className="rounded-full border border-foreground/25 px-7 py-3.5 font-geist-sans text-base font-medium text-foreground transition-colors duration-200 hover:border-foreground/50 hover:bg-foreground/5"
              href="#contact"
            >
              Contact
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.18} className="md:col-span-5 md:col-start-6">
          <p className="text-lede text-muted-text">
            I connect business objectives with audience research, content strategy,
            media planning, and performance measurement to help campaigns move with
            purpose.
          </p>

          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
            {[
              { label: "Focus", value: "Meta Ads" },
              { label: "Based in", value: "Yangon" },
              { label: "Availability", value: "Remote" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-eyebrow text-muted-text">{stat.label}</dt>
                <dd className="mt-2 font-geist-sans text-lg font-medium text-foreground">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.24} className="md:col-span-3">
          <PlaceholderPanel
            aspect="portrait"
            label="Portrait"
            title="Khant Nyi Nyi"
          />
        </Reveal>
      </div>
    </section>
  );
}