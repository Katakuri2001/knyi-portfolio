import { SectionHead } from "@/components/editorial";
import { Reveal } from "@/components/Reveal";
import { EXPERTISE_GROUPS, getServices } from "@/lib/content";

/**
 * Expertise — a numbered capability index, not a card grid.
 *
 * A full-bleed sunken band so the section reads as a different surface rather
 * than as another white box on grey. Four groups, each separated by a single
 * hairline, with the description supplied by services.json so the prose stays
 * in one place.
 */

export async function ExpertiseSection() {
  const services = await getServices();

  return (
    <section id="expertise" className="band-sunken relative">
      <div className="shell section-body">
        <SectionHead
          index="02"
          label="Core capabilities"
          title={
            <>
              Twelve areas,
              <br />
              {" "}<span className="text-muted-text">four working groups.</span>
            </>
          }
          lede="Campaigns rarely fail in one place alone, so the work spans research, planning, creative and measurement together. Each group below names what it covers and how it is put to use."
        />

        <div className="mt-14 md:mt-20">
          {EXPERTISE_GROUPS.map((group, i) => {
            const discipline = services[group.source];
            return (
              <Reveal key={group.index} delay={0.05 + i * 0.04}>
                <article className="grid gap-x-10 gap-y-6 border-t border-border py-9 md:grid-cols-12 md:py-11">
                  <div className="md:col-span-1">
                    <span className="text-index text-accent-ink/45">
                      {group.index}
                    </span>
                  </div>

                  <div className="md:col-span-4">
                    <h3 className="text-subtitle text-foreground">
                      {group.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-text">
                      {discipline.description}
                    </p>
                  </div>

                  <ol className="md:col-span-6 md:col-start-7">
                    {group.capabilities.map((capability, n) => (
                      <li
                        key={capability}
                        className="flex items-baseline gap-4 border-b border-border/70 py-2.5 last:border-b-0"
                      >
                        <span className="w-6 flex-none font-geist-mono text-[0.6875rem] text-muted-text/70">
                          {String(n + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[0.9375rem] leading-relaxed text-foreground">
                          {capability}
                        </span>
                      </li>
                    ))}
                  </ol>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.12}>
          <div className="grid gap-6 border-t border-border pt-7 md:grid-cols-3">
            {[
              {
                key: "metaAds",
                label: "Practical exposure",
                value: services.metaAds.experience,
              },
              {
                key: "contentStrategy",
                label: "Practical experience",
                value: services.contentStrategy.experience,
              },
              {
                key: "marketingAnalysis",
                label: "Practical exposure",
                value: services.marketingAnalysis.experience,
              },
            ].map((item) => (
              <div key={item.key}>
                <p className="text-meta text-accent-ink">{item.label}</p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-text">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}