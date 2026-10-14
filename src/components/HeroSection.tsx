import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { Reveal } from "@/components/Reveal";

export function HeroSection() {
  return (
    <section
      id="top"
      className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-center px-6 py-24 md:py-32"
    >
      <div className="grid w-full items-center gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <Reveal>
            <p className="font-method mb-5 text-xs uppercase tracking-[0.18em] text-accent-secondary">
              Independent performance marketer
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mb-6 font-geist-sans text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Diagnose first.
              <br />
              Scale with strategy.
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mb-9 max-w-lg text-lg leading-relaxed text-foreground">
              I connect business objectives with audience research, content
              strategy, media planning, and performance measurement to help
              campaigns move with purpose.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                className="rounded-full bg-accent-secondary px-7 py-3.5 font-geist-sans text-base font-medium text-on-dark transition-transform duration-200 hover:-translate-y-0.5"
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
        </div>

        <Reveal delay={0.14}>
          <PlaceholderPanel
            aspect="portrait"
            label="Portrait"
            title="Khant Nyi Nyi"
            detail="Performance marketer, Yangon"
          />
        </Reveal>
      </div>
    </section>
  );
}