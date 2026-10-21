import { Figure, SectionHead } from "@/components/editorial";
import { Reveal } from "@/components/Reveal";
import { SearchPerformanceFigure } from "@/components/visuals/SearchPerformanceFigure";
import { getServices, getTools } from "@/lib/content";

/**
 * Tools & capabilities — two honest lists, separated by weight not by colour.
 *
 * Practical exposure is set solid with teal markers. Currently learning is
 * indented, lighter and marked with hollow rings, so the difference survives
 * greyscale and colour-blind viewing. The figure beside it is captioned as an
 * illustrative diagram, because SEO fundamentals appear here as an area being
 * studied — not as a client result.
 */

function ToolRows({
  items,
  variant,
}: {
  items: string[];
  variant: "exposure" | "learning";
}) {
  const exposure = variant === "exposure";

  return (
    <ul>
      {items.map((tool, i) => (
        <li
          key={tool}
          className={[
            "flex items-center gap-4 border-t py-3 last:border-b",
            exposure
              ? "border-border"
              : "border-dashed border-border/90 pl-4 text-muted-text",
          ].join(" ")}
        >
          <span className="w-6 flex-none font-geist-mono text-[0.6875rem] text-muted-text/70">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span
            aria-hidden="true"
            className={[
              "h-2 w-2 flex-none rounded-full",
              exposure ? "bg-accent-ink" : "border border-muted-text/60",
            ].join(" ")}
          />
          <span
            className={[
              "flex-1 text-[0.9375rem]",
              exposure ? "font-medium text-foreground" : "",
            ].join(" ")}
          >
            {tool}
          </span>
        </li>
      ))}
    </ul>
  );
}

export async function ToolsSection() {
  const services = await getServices();
  const tools = await getTools();

  return (
    <section id="tools" className="band-sunken relative">
      <div className="shell section-body">
        <SectionHead
          index="05"
          label="Tools & capabilities"
          title={
            <>
              Practical tools,
              <br />
              {" "}<span className="text-muted-text">kept separate from learning.</span>
            </>
          }
          lede="Tools used in real campaign work are listed first. Areas still being studied are listed second, and nothing on this page claims a certification or an official partnership."
        />

        <div className="mt-14 grid gap-x-12 gap-y-14 md:mt-20 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                <h3 className="text-eyebrow text-foreground">
                  Practical exposure
                </h3>
                <span className="text-meta text-muted-text">
                  {tools.practicalExposure.length} tools
                </span>
              </div>
              <div className="mt-2">
                <ToolRows items={tools.practicalExposure} variant="exposure" />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-3 lg:col-start-6">
            <Reveal delay={0.06}>
              <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-border pt-4">
                <h3 className="text-eyebrow text-muted-text">
                  Currently learning
                </h3>
                <span className="text-meta text-muted-text">
                  {tools.currentlyLearning.length} areas
                </span>
              </div>
              <div className="mt-2">
                <ToolRows items={tools.currentlyLearning} variant="learning" />
              </div>

              <div className="mt-8 border-t border-dashed border-border pt-4">
                <p className="text-meta text-accent-ink">Also in progress</p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-text">
                  {services.marketingAnalysis.learning}.{" "}
                  {services.contentStrategy.learning}.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <Figure
                ratio="3 / 2"
                caption="Illustrative — not project output"
              >
                <SearchPerformanceFigure />
              </Figure>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}