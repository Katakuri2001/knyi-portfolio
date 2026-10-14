import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { Reveal } from "@/components/Reveal";

/**
 * Case-study content is hardcoded in the skeleton stage. It duplicates
 * content/case-studies.json and the two disagree — see
 * docs/STAGE-1-DESIGN-SKELETON.md "Known content drift". The JSON is the
 * intended source of truth once these become data-driven.
 */
const CASE_STUDIES = [
  {
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
  },
  {
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

export function CampaignCaseStudySection() {
  return (
    <section id="campaigns" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <Reveal>
        <p className="font-method mb-6 text-xs uppercase tracking-[0.18em] text-accent-secondary">
          Selected campaigns
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <h2 className="mb-14 font-geist-sans text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl">
          Campaign case studies
        </h2>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CASE_STUDIES.map((study, index) => (
          <Reveal key={study.label} delay={0.1 + index * 0.06}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-accent-ink/40 hover:shadow-lg hover:shadow-accent-secondary/5 dark:bg-white/[0.04]">
              <PlaceholderPanel label={study.label} title={study.panelTitle} />

              <div className="flex flex-1 flex-col p-6">
                <p className="font-method text-xs uppercase tracking-[0.18em] text-accent-secondary">
                  {study.category}
                </p>

                <h3 className="mt-3 font-geist-sans text-lg font-bold">
                  {study.platform}
                </h3>
                <p className="mt-1 text-muted-text">{study.summary}</p>

                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border/50 pt-6">
                  {study.metrics.map((metric) => (
                    <div key={metric.label}>
                      <dt className="font-method text-xs uppercase tracking-[0.14em] text-muted-text">
                        {metric.label}
                      </dt>
                      <dd className="mt-1 font-geist-sans font-medium text-accent-ink">
                        {metric.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 border-t border-border/50 pt-4 text-xs leading-relaxed text-muted-text">
                  {study.footnote}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}