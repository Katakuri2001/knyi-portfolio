import { SectionHead } from "@/components/editorial";
import { Reveal } from "@/components/Reveal";

/**
 * Working method — a process spine, explained rather than decorated.
 *
 * A single hairline runs the width of the section with four nodes on it. The
 * stages are the ones the site already documented; a loop-back marker at the
 * end reflects "continuous improvement", which is one of the existing items.
 * The diagram is static: it reads identically with motion off.
 */

const STAGES = [
  {
    number: "01",
    title: "Diagnose",
    summary: "Establish what is actually wrong before spending anything on it.",
    items: [
      "Business problem analysis",
      "Market & competitor research",
      "Objective clarification",
      "Offer assessment",
    ],
  },
  {
    number: "02",
    title: "Strategize",
    summary: "Decide who the campaign is for and what it has to change.",
    items: [
      "Audience & competitor research",
      "Positioning & messaging",
      "Content pillars development",
      "Campaign structuring",
    ],
  },
  {
    number: "03",
    title: "Plan",
    summary: "Turn the strategy into media, creative and budget decisions.",
    items: [
      "Creative direction",
      "Media planning & channel mix",
      "Budget allocation",
      "Measurement framework",
    ],
  },
  {
    number: "04",
    title: "Optimize",
    summary: "Read performance, find the opportunity, iterate on it.",
    items: [
      "Performance monitoring",
      "Opportunity identification",
      "Data-driven iteration",
      "Continuous improvement",
    ],
  },
];

export async function WorkingMethodSection() {
  return (
    <section id="approach" className="relative">
      <div className="shell section-lead">
        <SectionHead
          index="04"
          label="Working method"
          title={
            <>
              Four stages,
              <br />
              {" "}<span className="text-muted-text">in order, every time.</span>
            </>
          }
          lede="Research feeds the plan, execution feeds the measurement, and the measurement feeds the next round of research. Skipping the first stage is the most expensive mistake available."
        />

        {/* Spine: one rule with a node per stage. On mobile the rule turns
            vertical. Purely structural — no motion, nothing to animate. */}
        <div className="relative mt-16 md:mt-24">
          {/* Horizontal rule, desktop */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-[0.6875rem] hidden h-px bg-border lg:block"
          />
          {/* Vertical rule, mobile */}
          <div
            aria-hidden="true"
            className="absolute bottom-4 left-[0.34375rem] top-4 w-px bg-border lg:hidden"
          />

          <ol className="grid gap-y-12 lg:grid-cols-4 lg:gap-x-8">
            {STAGES.map((stage, i) => (
              <Reveal as="li" key={stage.number} delay={0.05 + i * 0.05}>
                <div className="relative lg:pl-0 lg:pt-0">
                  {/* Node sits on the spine. */}
                  <span
                    aria-hidden="true"
                    className="absolute -left-0 top-0 flex h-3 w-3 -translate-y-[1.5px] items-center justify-center lg:static lg:mb-7 lg:translate-y-0"
                  >
                    <span className="absolute h-[1.375rem] w-px bg-border lg:hidden" />
                    <span
                      className="relative block h-[0.6875rem] w-[0.6875rem] rounded-full border-2 border-accent-ink bg-background"
                      style={{ boxShadow: "0 0 0 4px var(--color-background)" }}
                    />
                  </span>

                  <div className="pl-7 lg:pl-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-meta tracking-[0.18em] text-accent-ink">
                        {stage.number}
                      </span>
                      {i === STAGES.length - 1 ? (
                        <span className="text-meta text-muted-text">
                          ↺ loops back
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 text-subtitle text-foreground">
                      {stage.title}
                    </h3>

                    <p className="mt-3 leading-relaxed text-muted-text">
                      {stage.summary}
                    </p>

                    <ul className="mt-5 border-t border-border/80 pt-3">
                      {stage.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 py-1.5 text-[0.875rem] leading-relaxed text-muted-text"
                        >
                          <span aria-hidden="true" className="tick" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Outcome row — what the method is for. */}
        <Reveal delay={0.1}>
          <div className="mt-16 grid gap-x-10 gap-y-6 border-t border-border pt-8 md:grid-cols-3">
            {[
              {
                head: "Inputs",
                body: "Business objectives, audience research, competitor research, offer analysis.",
              },
              {
                head: "Decisions",
                body: "Objectives, audience, positioning, creative direction, channel mix, budget.",
              },
              {
                head: "Feedback",
                body: "Performance monitoring, opportunity identification, data-driven iteration.",
              },
            ].map((item) => (
              <div key={item.head}>
                <p className="flex items-center gap-3 text-eyebrow text-foreground">
                  <span aria-hidden="true" className="tick mt-0" />
                  {item.head}
                </p>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-text">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}