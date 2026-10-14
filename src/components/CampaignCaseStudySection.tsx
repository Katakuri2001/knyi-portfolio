import Image from "next/image";

export function CampaignCaseStudySection() {
  return (
    <section
      className="py-24 md:py-32 px-6 max-w-7xl mx-auto"
    >
      <div className="max-w-7xl mx-auto">
        <p
          className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-12"
        >
          SELECTED CAMPAIGNS
        </p>

        <h2 className="font-geist-sans text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight mb-12">
          Campaign Case Studies
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* CASE STUDY A: MODULAR BUILDING BUSINESS */}
          <article
            className="
              group
              bg-white dark:bg-bg-dark
              border border-border/30
              rounded-2xl
              overflow-hidden
              transition-all duration-500
              hover:border-accent-primary/50
              hover:shadow-lg
            "
          >
            <div className="relative h-64 md:h-80 overflow-hidden">
              <Image
                src="/placeholder-building.jpg"
                alt="Modular Building Business case study"
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                width={800}
                height={600}
              />
              <div
                className="
                  absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                "
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="
                    text-xs font-medium
                    text-accent-secondary
                    uppercase
                    tracking-wider
                  "
                >
                  MODULAR BUILDING BUSINESS
                </span>
              </div>

              <h3 className="font-geist-sans text-xl font-bold mb-2">
                Meta advertising
              </h3>

              <p className="text-muted/60 text-sm mb-4">
                Performance marketing campaign
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-method">Ad Spend</p>
                  <p className="text-accent-primary">US$160</p>
                </div>
                <div>
                  <p className="font-method">Duration</p>
                  <p>2 months</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <p className="font-method">Audience</p>
                  <p className="text-accent-primary">0 &rarr; ~300 followers</p>
                </div>
                <div>
                  <p className="font-method">Orders</p>
                  <p>1 order</p>
                </div>
              </div>

              <p className="text-xs text-muted/50 mt-4">
                Results are reported or estimated from the available project figures.
                They have not been independently verified, and advertising-attributed
                revenue is not claimed.
              </p>
            </div>
          </article>

          {/* CASE STUDY B: READY-MADE PARATHA BUSINESS */}
          <article
            className="
              group
              bg-white dark:bg-bg-dark
              border border-border/30
              rounded-2xl
              overflow-hidden
              transition-all duration-500
              hover:border-accent-primary/50
              hover:shadow-lg
            "
          >
            <div className="relative h-64 md:h-80 overflow-hidden">
              <Image
                src="/placeholder-paratha.jpg"
                alt="Ready-Made Paratha Business case study"
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                width={800}
                height={600}
              />
              <div
                className="
                  absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                "
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="
                    text-xs font-medium
                    text-accent-secondary
                    uppercase
                    tracking-wider
                  "
                >
                  READY-MADE PARATHA BUSINESS
                </span>
              </div>

              <h3 className="font-geist-sans text-xl font-bold mb-2">
                Meta advertising
              </h3>

              <p className="text-muted/60 text-sm mb-4">
                Performance marketing campaign
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-method">Ad Spend</p>
                  <p className="text-accent-primary">US$170</p>
                </div>
                <div>
                  <p className="font-method">Duration</p>
                  <p>2 months</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <p className="font-method">Audience</p>
                  <p className="text-accent-primary">0 &rarr; ~2,000 followers</p>
                </div>
                <div>
                  <p className="font-method">Orders</p>
                  <p>~200 orders</p>
                </div>
              </div>

              <p className="text-xs text-muted/50 mt-4">
                Results are reported or estimated from the available project figures.
                They have not been independently verified, and advertising-attributed
                revenue is not claimed.
              </p>
            </div>
          </article>

          {/* CASE STUDY C: WOMEN UNDERWEAR TAILORING */}
          <article
            className="
              group
              bg-white dark:bg-bg-dark
              border border-border/30
              rounded-2xl
              overflow-hidden
              transition-all duration-500
              hover:border-accent-primary/50
              hover:shadow-lg
            "
          >
            <div className="relative h-64 md:h-80 overflow-hidden">
              <Image
                src="/placeholder-undertaking.jpg"
                alt="Women Underwear Tailoring case study"
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                width={800}
                height={600}
              />
              <div
                className="
                  absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                "
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="
                    text-xs font-medium
                    text-accent-secondary
                    uppercase
                    tracking-wider
                  "
                >
                  WOMEN UNDERWEAR TAILORING
                </span>
              </div>

              <h3 className="font-geist-sans text-xl font-bold mb-2">
                Multi-channel marketing
              </h3>

              <p className="text-muted/60 text-sm mb-4">
                Brand strategy & content planning
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-method">Avg Orders/Month</p>
                  <p className="text-accent-primary">~50</p>
                </div>
                <div>
                  <p className="font-method">Avg Order Value</p>
                  <p className="text-accent-primary">US$5</p>
                </div>
              </div>

              <p className="text-xs text-muted/50 mt-4">
                Scope included brand strategy, content planning, consultation, and
                multi-channel marketing. No ad-spend figure is supplied for this
                case study.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
