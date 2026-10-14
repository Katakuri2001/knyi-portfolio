import { Reveal } from "@/components/Reveal";

const EXPOSURE = [
  "Meta Ads Manager",
  "Canva",
  "Google Sheets",
  "ChatGPT",
  "Facebook Marketing",
  "Meta Pixel",
  "UTM parameters",
];

const LEARNING = ["GA4", "GTM", "Google Ads / SEM", "TikTok Ads", "SEO fundamentals"];

function ToolList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((tool) => (
        <li
          key={tool}
          className="flex items-center justify-between gap-4 py-3.5 transition-colors duration-200 hover:bg-surface"
        >
          <span
            className={`font-geist-sans text-lg ${muted ? "text-muted-text" : "text-foreground"}`}
          >
            {tool}
          </span>
          <span
            aria-hidden="true"
            className={[
              "h-1.5 w-1.5 flex-none rounded-full",
              muted ? "bg-border" : "bg-accent-primary",
            ].join(" ")}
          />
        </li>
      ))}
    </ul>
  );
}

export function ToolsSection() {
  return (
    <section id="tools" className="section-body scroll-mt-24 px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-secondary">
            <span className="h-px w-12 bg-accent-secondary/40" aria-hidden="true" />
            Tools &amp; capabilities
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <Reveal delay={0.06} className="lg:col-span-7">
            <h2 className="text-title text-foreground">Practical tools</h2>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
            <p className="text-muted-text leading-relaxed">
              Tools used in real campaign work, kept separate from what is still
              being learned.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-14 md:grid-cols-2">
          <Reveal delay={0.14}>
            <div>
              <h3 className="text-eyebrow mb-2 text-foreground">
                Practical exposure
              </h3>
              <p className="mb-6 text-sm text-muted-text">
                {EXPOSURE.length} tools in active use
              </p>
              <ToolList items={EXPOSURE} />
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div>
              <h3 className="text-eyebrow mb-2 text-muted-text">
                Currently learning
              </h3>
              <p className="mb-6 text-sm text-muted-text">
                {LEARNING.length} areas in progress
              </p>
              <ToolList items={LEARNING} muted />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}