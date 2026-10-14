import Image from "next/image";

export function HeroSection() {
  return (
    <section
      className="min-h-[60vh] relative flex items-center justify-center overflow-hidden px-6 py-24 md:py-32"
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
                font-geist-sans text-accent-primary text-base font-medium
                px-6 py-3 rounded-full border border-accent-primary/30
                transition-colors hover:bg-accent-primary/10
              "
              href="#work"
            >
              Explore My Work
            </a>
            <a
              className="
                font-geist-sans text-foreground text-base font-medium
                px-6 py-3 rounded-full border border-border/40
                transition-colors hover:bg-border/10
              "
              href="#contact"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image
            src="/knyi-portrait-placeholder.jpg"
            alt="Khant Nyi Nyi - Performance Marketer"
            className="rounded-2xl object-cover w-full h-[450px] md:h-[550px] transition-opacity duration-500 hover:opacity-90"
            width={800}
            height={1000}
            priority
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
