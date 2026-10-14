import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { Reveal } from "@/components/Reveal";

/**
 * Case-study content is hardcoded in the skeleton stage. It duplicates
 * content/case-studies.json and the two disagree — see
 * docs/STAGE-1-DESIGN-SKELETON.md "Known content drift". The JSON is the
 * intended source of truth once these become data-driven.
 *
 * The first study is featured and spans two columns so the section has a
 * clear focal point rather than three identical cards.
 */
const CASE_STUDIES = [
  {
    index: "01",
    label: "Case study 01",
    panelTitle: "Modular Building",
    category: "Modular Building Business",
    platform: "Meta advertising",
    summary: "Performance marketing campaign",
    metrics: [
      { label: "Ad Spend", value: "US$160" },
      { label: "Duration", value: "2 months" },
      { label: "Audience", value: "0 → ~300 followers" },
      { label: "Orders", value: "1 order" },
    ],
    footnote:
      "Results are reported or estimated from the available project figures. They have not been independently verified, and advertising-attributed revenue is not claimed.",
    featured: true,
  },
  {
    index: "02",
    label: "Case study 02",
    panelTitle: "Ready-Made Paratha",
    category: "Ready-Made Paratha Business",
    platform: "Meta advertising",
    summary: "Performance marketing campaign",
    metrics: [
      { label: "Ad Spend", value: "US$170" },
      { label: "Duration", value: "2 months" },
      { label: "Audience", value: "0 → ~2,000 followers" },
      { label: "Orders", value: "~200 orders" },
    ],
    footnote:
      "Results are reported or estimated from the available project figures. They have not been independently verified, and advertising-attributed revenue is not claimed.",
  },
  {
    index: "03",
    label: "Case study 03",
    panelTitle: "Women's Underwear Tailoring",
    category: "Women's Underwear Tailoring",
    platform: "Multi-channel marketing",
    summary: "Brand strategy & content planning",
    metrics: [
      { label: "Avg Orders/Month", value: "~50" },
      { label: "Avg Order Value", value: "US$5" },
    ],
    footnote:
      "Scope included brand strategy, content planning, consultation, and multi-channel marketing. No ad-spend figure is supplied for this case study.",
  },
];

function Metrics({ metrics }: { metrics: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-7">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt className="text-eyebrow text-muted-text">{metric.label}</dt>
          <dd className="mt-2 font-geist-sans text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CampaignCaseStudySection() {
  const [featured, ...rest] = CASE_STUDIES;

  return (
    <section id="campaigns" className="section-body scroll-mt-24 px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-secondary">
            <span className="h-px w-12 bg-accent-secondary/40" aria-hidden="true" />
            Selected campaigns
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <Reveal delay={0.06} className="lg:col-span-7">
            <h2 className="text-title text-foreground">
              Campaign
              <br />
              case studies
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
            <p className="text-muted-text leading-relaxed">
              Figures below are reported or estimated from available project
              data. They have not been independently verified.
            </p>
          </Reveal>
        </div>

        {/* Featured study: full width, dark, the page's visual anchor. */}
        <Reveal delay={0.14}>
          <article className="mt-16 grid overflow-hidden rounded-3xl bg-ink lg:grid-cols-2">
            <PlaceholderPanel
              label={featured.label}
              title={featured.panelTitle}
              aspect="portrait"
              tone="dark"
              className="min-h-[320px] lg:min-h-full"
            />
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="text-eyebrow text-accent-primary">
                {featured.category}
              </p>
              <h3 className="mt-4 font-geist-sans text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
                {featured.platform}
              </h3>
              <p className="mt-2 text-on-dark/70">{featured.summary}</p>

              <div className="mt-10 border-t border-white/15 pt-8">
                <Metrics metrics={featured.metrics} />
              </div>

              <p className="mt-8 text-xs leading-relaxed text-on-dark-muted">
                {featured.footnote}
              </p>
            </div>
          </article>
        </Reveal>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {rest.map((study, i) => (
            <Reveal key={study.index} delay={0.18 + i * 0.06}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors duration-300 hover:border-accent-ink/40">
                <PlaceholderPanel label={study.label} title={study.panelTitle} />

                <div className="flex flex-1 flex-col p-8">
                  <p className="text-eyebrow text-accent-secondary">
                    {study.category}
                  </p>
                  <h3 className="mt-3 font-geist-sans text-xl font-bold tracking-tight text-foreground">
                    {study.platform}
                  </h3>

                  <div className="mt-8 border-t border-border pt-6">
                    <Metrics metrics={study.metrics} />
                  </div>

                  <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-text">
                    {study.footnote}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}