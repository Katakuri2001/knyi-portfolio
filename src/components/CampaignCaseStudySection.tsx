import { Ledger, Note, SectionHead } from "@/components/editorial";
import { CaseVisual } from "@/components/CaseVisual";
import { Reveal } from "@/components/Reveal";
import { AudienceResearchFigure } from "@/components/visuals/AudienceResearchFigure";
import { CampaignCreativeFigure } from "@/components/visuals/CampaignCreativeFigure";
import { CampaignStructureFigure } from "@/components/visuals/CampaignStructureFigure";
import {
  caseMetrics,
  caseTitle,
  getCaseStudies,
  type CaseMetric,
  type CaseStudy,
} from "@/lib/content";

/**
 * Selected campaigns — one featured study plus every supporting study.
 *
 * The previous version rendered one dark feature and two identical glass cards
 * in a 2-up grid. Each study now gets a mode chosen for its content:
 *
 *   Mode A — featured: full-bleed dark room, wide editorial split. Carries the
 *            campaign-creative plate and the full metric ledger.
 *   Mode B — wide row: horizontal split with the plan-structure plate, ledger
 *            beside it.
 *   Mode C — offset card: narrower, pushed off the centre line, oversized index
 *            numeral in the margin.
 *
 * The first study is always the featured one. The rest alternate between Mode B
 * and Mode C, so the section renders **any** number of studies and no two
 * supporting studies look alike — a fourth case study added through /admin
 * appears here without this file needing to change.
 *
 * Every figure and metric comes from content/case-studies.json. A metric the
 * data does not supply is not rendered — nothing is filled in.
 */

function ReportedTag({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 px-2.5 py-1 text-meta",
        tone === "dark"
          ? "border border-white/25 text-on-dark-muted"
          : "border border-accent-ink/45 text-accent-ink",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background:
            tone === "dark"
              ? "var(--color-accent-primary)"
              : "var(--color-accent-ink)",
        }}
      />
      Reported figures
    </span>
  );
}

function MetricBlock({
  metrics,
  tone,
}: {
  metrics: CaseMetric[];
  tone: "light" | "dark";
}) {
  if (metrics.length === 0) return null;
  return (
    <div>
      <p
        className={[
          "figure-caption mb-3",
          tone === "dark" ? "text-on-dark-muted" : "text-muted-text",
        ].join(" ")}
      >
        Available figures
      </p>
      <Ledger items={metrics} tone={tone} />
    </div>
  );
}

function indexLabel(position: number): string {
  return String(position + 1).padStart(2, "0");
}

/* ---------------------------------------------------------------------------
   Mode A — featured, full-bleed dark room
   --------------------------------------------------------------------------- */

function FeaturedStudy({ study }: { study: CaseStudy }) {
  return (
    <Reveal>
      <div className="room-dark mt-14 md:mt-20">
        <div className="shell py-12 md:py-16">
          <div className="grid items-center gap-x-10 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <CaseVisual
                study={study}
                ratio="9 / 10"
                caption="Case study 01 — campaign visual"
                captionTone="dark"
                priority
                fallback={<CampaignCreativeFigure />}
              />
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <div className="flex items-baseline gap-4 pt-4">
                <span className="text-meta tracking-[0.18em] text-accent-primary">
                  01
                </span>
                <span className="text-eyebrow text-accent-primary">
                  Featured case study
                </span>
              </div>

              <h3 className="mt-6 text-title text-white">{caseTitle(study)}</h3>

              <p className="mt-4 text-subtitle text-on-dark">{study.platform}</p>

              {study.scope ? (
                <p className="mt-4 leading-relaxed text-on-dark-muted">
                  Scope: {study.scope}.
                </p>
              ) : null}

              <div className="mt-9">
                <MetricBlock metrics={caseMetrics(study)} tone="dark" />
              </div>

              <div className="mt-8">
                <ReportedTag tone="dark" />
              </div>

              {study.methodologyNote ? (
                <div className="mt-8">
                  <Note tone="dark">{study.methodologyNote}</Note>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------------------------------------------------------------------
   Mode B — wide horizontal row
   --------------------------------------------------------------------------- */

function WideStudy({
  study,
  position,
  last,
}: {
  study: CaseStudy;
  position: number;
  last: boolean;
}) {
  return (
    <Reveal>
      <div className={`shell ${last ? "pb-16 md:pb-24" : "section-body"}`}>
        <article className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <CaseVisual
              study={study}
              ratio="5 / 4"
              caption={`Case study ${indexLabel(position)} — campaign visual`}
              fallback={
                <div className="h-full w-full bg-surface">
                  <CampaignStructureFigure />
                </div>
              }
            />
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <div className="flex items-baseline gap-4 border-t border-border pt-4">
              <span className="text-meta tracking-[0.18em] text-accent-ink">
                {indexLabel(position)}
              </span>
              <span className="text-eyebrow text-accent-ink">
                Supporting case study
              </span>
            </div>

            <h3 className="mt-5 text-subtitle text-foreground">
              {caseTitle(study)}
            </h3>

            <p className="mt-3 text-[0.9375rem] text-foreground/85">
              {study.platform}
            </p>

            {study.scope ? (
              <p className="mt-3 leading-relaxed text-muted-text">
                Scope: {study.scope}.
              </p>
            ) : null}

            <div className="mt-7">
              <MetricBlock metrics={caseMetrics(study)} tone="light" />
            </div>

            <div className="mt-6">
              <ReportedTag />
            </div>

            {study.methodologyNote ? (
              <div className="mt-7">
                <Note>{study.methodologyNote}</Note>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </Reveal>
  );
}

/* ---------------------------------------------------------------------------
   Mode C — offset editorial card
   --------------------------------------------------------------------------- */

function OffsetStudy({
  study,
  position,
  last,
}: {
  study: CaseStudy;
  position: number;
  last: boolean;
}) {
  return (
    <div className={`shell ${last ? "pb-16 md:pb-24" : "pb-6 md:pb-10"}`}>
      <Reveal>
        <article className="grid gap-x-10 gap-y-8 border-t border-border pt-10 md:grid-cols-12">
          {/* Oversized numeral lives in the margin, not inside a box. */}
          <div className="md:col-span-1">
            <span className="text-index text-accent-ink/45">
              {indexLabel(position)}
            </span>
          </div>

          <div className="md:col-span-4 md:col-start-3">
            <p className="text-eyebrow text-accent-ink">Supporting case study</p>
            <h3 className="mt-5 text-subtitle text-foreground">
              {caseTitle(study)}
            </h3>
            <p className="mt-3 text-[0.9375rem] text-foreground/85">
              {study.platform}
            </p>
            {study.scope ? (
              <p className="mt-3 leading-relaxed text-muted-text">
                Scope: {study.scope}.
              </p>
            ) : null}

            <div className="mt-6">
              <MetricBlock metrics={caseMetrics(study)} tone="light" />
            </div>

            <div className="mt-6">
              <ReportedTag />
            </div>
          </div>

          <div className="md:col-span-5 md:col-start-8">
            <CaseVisual
              study={study}
              ratio="5 / 4"
              caption={`Case study ${indexLabel(position)} — campaign visual`}
              fallback={
                <div className="h-full w-full bg-surface">
                  <AudienceResearchFigure />
                </div>
              }
            />

            {study.methodologyNote ? (
              <div className="mt-7">
                <Note>{study.methodologyNote}</Note>
              </div>
            ) : null}
          </div>
        </article>
      </Reveal>
    </div>
  );
}

export async function CampaignCaseStudySection() {
  const studies = await getCaseStudies();
  const [featured, ...supporting] = studies;

  if (!featured) {
    return (
      <section id="campaigns" className="relative">
        <div className="shell section-body">
          <SectionHead
            index="03"
            label="Selected campaigns"
            title={
              <>
                Campaign
                <br />
                {" "}
                <span className="text-muted-text">case studies.</span>
              </>
            }
            lede="Case studies are being added. Check back shortly."
          />
        </div>
      </section>
    );
  }

  return (
    <section id="campaigns" className="relative">
      <div className="shell pt-16 md:pt-24">
        <SectionHead
          index="03"
          label="Selected campaigns"
          title={
            <>
              {studies.length === 1 ? "One campaign" : `${studies.length} campaigns`}
              <br />
              {" "}
              <span className="text-muted-text">reported honestly.</span>
            </>
          }
          lede="Each study below is drawn from the project record. Figures are reported or estimated and have not been independently verified; no revenue, ROAS or conversion rate is claimed where the record does not supply one."
        />
      </div>

      <FeaturedStudy study={featured} />

      {supporting.map((study, i) => {
        const position = i + 1;
        const last = i === supporting.length - 1;
        return i % 2 === 0 ? (
          <WideStudy
            key={study.id}
            study={study}
            position={position}
            last={last}
          />
        ) : (
          <OffsetStudy
            key={study.id}
            study={study}
            position={position}
            last={last}
          />
        );
      })}
    </section>
  );
}
