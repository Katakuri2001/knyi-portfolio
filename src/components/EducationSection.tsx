import { Note, SectionHead } from "@/components/editorial";
import { Reveal } from "@/components/Reveal";
import { getEducation } from "@/lib/content";

/**
 * Education — a single timeline rather than two card columns.
 *
 * Years run down a vertical rail with a node each. Completed entries get a
 * filled teal node and a year; ongoing entries get a hollow node and the word
 * "Ongoing", so the distinction never rests on colour alone. Content is read
 * from content/education.json, including the university status verbatim.
 */

type Entry = {
  name: string;
  institution: string;
  year: string;
  ongoing: boolean;
};

export function EducationSection() {
  const { completed, currentlyStudying, university } = getEducation();

  // Ongoing entries first, then completed ones newest-first.
  const timeline: Entry[] = [
    ...currentlyStudying.map((item) => ({
      name: item.name,
      institution: item.institution,
      year: "Ongoing",
      ongoing: true,
    })),
    ...[...completed]
      .sort((a, b) => b.year - a.year)
      .map((item) => ({
        name: item.name,
        institution: item.institution,
        year: String(item.year),
        ongoing: false,
      })),
  ];

  return (
    <section id="education" className="relative">
      <div className="shell section-body">
        <SectionHead
          index="06"
          label="Education & professional development"
          title={
            <>
              Training, and
              <br />
              {" "}<span className="text-muted-text">what is still in progress.</span>
            </>
          }
          lede="Short-form training completed between 2023 and 2025, and advanced digital marketing currently being studied. No completed university degree is claimed."
        />

        <div className="mt-14 grid gap-x-12 gap-y-12 md:mt-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ol className="relative">
              {/* Rail */}
              <div
                aria-hidden="true"
                className="absolute bottom-3 left-[0.34375rem] top-3 w-px bg-border"
              />

              {timeline.map((entry, i) => (
                <Reveal as="li" key={entry.name + entry.institution} delay={0.04 + i * 0.04}>
                  <div className="relative pb-9 pl-8 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[0.375rem] flex h-[0.6875rem] w-[0.6875rem] items-center justify-center"
                    >
                      {entry.ongoing ? (
                        <span
                          className="block h-[0.6875rem] w-[0.6875rem] rounded-full border-2 border-accent-ink bg-background"
                          style={{ boxShadow: "0 0 0 4px var(--color-background)" }}
                        />
                      ) : (
                        <span
                          className="block h-[0.6875rem] w-[0.6875rem] rounded-full bg-accent-ink"
                          style={{ boxShadow: "0 0 0 4px var(--color-background)" }}
                        />
                      )}
                    </span>

                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border/80 pb-4">
                      <div className="min-w-0">
                        <p className="text-[1.0625rem] font-medium leading-snug text-foreground">
                          {entry.name}
                        </p>
                        <p className="mt-0.5 text-[0.9375rem] text-muted-text">
                          {entry.institution}
                        </p>
                      </div>
                      <span
                        className={[
                          "flex-none text-meta",
                          entry.ongoing ? "text-accent-ink" : "text-muted-text",
                        ].join(" ")}
                      >
                        {entry.ongoing ? (
                          <span className="inline-flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="inline-block h-1.5 w-1.5 rounded-full border border-accent-ink"
                            />
                            Ongoing
                          </span>
                        ) : (
                          entry.year
                        )}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <div className="border-t border-border pt-5">
                <p className="text-eyebrow mb-4 text-accent-ink">
                  University
                </p>
                <Note label="Status">{university.status}</Note>

                <p className="mt-6 leading-relaxed text-muted-text">
                  Professional development has continued through short courses
                  and self-directed study since then, with practical campaign
                  work running alongside from 2023.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}