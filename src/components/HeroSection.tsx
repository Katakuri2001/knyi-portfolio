import { PlaceholderPanel } from "@/components/PlaceholderPanel";

export function HeroSection() {
  return (
    <section
      id="top"
      className="min-h-[60vh] relative flex items-center justify-center overflow-hidden px-6 pt-32 pb-24 md:pt-40 md:pb-32"
    >
      <div className="max-w-7xl w-full flex flex-col items-center md:flex-row md:items-start md:w-[90%] gap-8">
        <div className="text-center md:text-left w-full md:w-1/2">
          <p
            className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-4"
          >
            INDEPENDENT PERFORMANCE MARKETER
          </p>

          <h1 className="font-geist-sans text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            Diagnose first. Scale with strategy.
          </h1>

          <p className="text-foreground text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            I connect business objectives with audience research, content strategy,
            media planning, and performance measurement to help campaigns move
            with purpose.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              className="
                font-geist-sans text-on-dark text-base font-medium
                px-6 py-3 rounded-full bg-accent-secondary
                transition-transform hover:-translate-y-0.5
              "
              href="#campaigns"
            >
              Explore My Work
            </a>
            <a
              className="
                font-geist-sans text-foreground text-base font-medium
                px-6 py-3 rounded-full border border-foreground/25
                transition-colors hover:border-foreground/50 hover:bg-foreground/5
              "
              href="#contact"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="relative w-full md:w-1/2">
          <PlaceholderPanel
            aspect="portrait"
            label="Portrait"
            title="Khant Nyi Nyi"
            detail="Performance marketer, Yangon"
          />
        </div>
      </div>
    </section>
  );
}
