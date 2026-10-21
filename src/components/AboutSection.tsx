import { Figure, Note, SectionHead } from "@/components/editorial";
import { Reveal } from "@/components/Reveal";
import { ResearchNotesFigure } from "@/components/visuals/ResearchNotesFigure";
import { getProfile } from "@/lib/content";

/**
 * About — philosophy, not a skills list.
 *
 * Opens on the positioning statement at display scale, then splits into two
 * plain text columns: how I think, and what I value. The experience record
 * underneath is a dated ledger read from content/education.json and
 * profile.json, so it cannot drift from the data.
 */

export async function AboutSection() {
  const profile = await getProfile();

  return (
    <section id="about" className="relative">
      <div className="shell section-lead">
        <SectionHead
          index="01"
          label="Background"
          title={
            <>
              Diagnose First.
              <br />
              {" "}Strategize Better.{" "}
              <span className="text-muted-text">Optimize for Growth.</span>
            </>
          }
          lede={profile.background}
        />

        <div className="mt-16 grid gap-y-12 md:mt-20 md:grid-cols-12 md:gap-x-10">
          <Reveal delay={0.08} className="md:col-span-7">
            <p className="text-eyebrow mb-5 text-accent-ink">How I think</p>
            <p className="text-subtitle max-w-2xl text-foreground">
              A campaign built on a wrong diagnosis cannot be rescued by better
              creative. So the diagnosis comes first,{" "}
              <span className="text-muted-text">every time.</span>
            </p>

            <p className="text-lede mt-7 max-w-xl text-muted-text">
              {profile.howITick}
            </p>

            {/* The three questions the plan starts from. */}
            <ol className="mt-9 max-w-xl border-t border-border">
              {[
                "What is the business problem?",
                "Who is the audience, and who is not?",
                "What is already being said in this market?",
              ].map((question, i) => (
                <li
                  key={question}
                  className="flex items-baseline gap-5 border-b border-border/80 py-4"
                >
                  <span className="text-meta w-6 flex-none text-accent-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[1.0625rem] leading-relaxed text-foreground">
                    {question}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.14} className="md:col-span-4 md:col-start-9">
            <div className="border-t border-border pt-5">
              <p className="text-eyebrow mb-4 text-accent-ink">What I value</p>
              <p className="text-lede text-muted-text">
                {profile.whatIVALUE}
              </p>
            </div>

            <div className="mt-10 border-t border-border pt-5">
              <p className="text-eyebrow mb-4 text-accent-ink">
                Experience to date
              </p>
              <p className="leading-relaxed text-muted-text">
                Freelance content writing and Facebook marketing, 2023–2026,
                alongside graphic design, content writing and digital marketing
                training. Currently studying Digital Marketing Advanced.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Supporting plate — the research desk, captioned as illustrative. */}
        <Reveal delay={0.16}>
          <div className="mt-16 grid items-center gap-8 border-t border-border pt-8 md:mt-20 md:grid-cols-12">
            <div className="md:col-span-6">
              <Figure ratio="16 / 11" className="max-w-xl">
                <div className="h-full w-full bg-surface-sunken">
                  <ResearchNotesFigure />
                </div>
              </Figure>
            </div>

            <div className="md:col-span-5 md:col-start-8">
              <Note label="Figure — research and planning notes">
                Audience and competitor research is how a plan starts. Segments
                are mapped before spend is allocated, and the map is revised
                once real campaign data comes back.
              </Note>
              <p className="mt-8 leading-relaxed text-muted-text">
                That loop — research, plan, read the data, revise the read — is
                the part of the job that decides whether creative is worth
                producing in the first place.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}