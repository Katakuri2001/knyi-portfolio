import Image from "next/image";
import Link from "next/link";
import { Figure, SectionMarker } from "@/components/editorial";
import { Reveal } from "@/components/Reveal";
import { getProfile } from "@/lib/content";

/**
 * Hero — asymmetric editorial opening.
 *
 * Composition, top to bottom:
 *   1. A full-bleed section marker sitting on a hairline that runs the whole
 *      measure, so the eye starts on a rule rather than on a centred blob.
 *   2. The positioning line as three set lines. Line three is de-emphasised, so
 *      the headline has a shape instead of reading as one flat block.
 *   3. An offset two-column body: the introduction at the left, a plain
 *      metadata ledger at the right — no glass box.
 *   4. Actions: one solid navy block with a teal keyline, one text link.
 *   5. The portrait plate, held in the right column and deliberately allowed to
 *      bleed past the text measure.
 *
 * Everything below the fold reveals through the existing Reveal component,
 * which shows content when JavaScript is unavailable or motion is reduced.
 */

const PROCESS_LINE = [
  "Diagnose",
  "Research",
  "Strategize",
  "Plan",
  "Optimize",
];

export function HeroSection() {
  const profile = getProfile();

  return (
    <section id="top" className="relative">
      <div className="shell pb-16 pt-16 md:pb-24 md:pt-24 lg:pt-28">
        <Reveal>
          <SectionMarker
            index="00"
            label={profile.tagline.charAt(0) + profile.tagline.slice(1).toLowerCase()}
          />
        </Reveal>

        <div className="mt-10 grid gap-y-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
          {/* — Headline + body: columns 1–7 — */}
          <div className="lg:col-span-7">
            <Reveal delay={0.05}>
              <h1 className="text-display text-foreground">
                Diagnose First.
                <br />
                {" "}Strategize
                <br />
                {" "}<span className="text-muted-text">Better.</span>
              </h1>
            </Reveal>

            <div className="mt-10 grid gap-8 sm:grid-cols-12">
              <Reveal delay={0.1} className="sm:col-span-7">
                <p className="text-lede text-muted-text">
                  I connect business objectives to audience research, content
                  strategy, media planning and performance measurement — so
                  campaigns move with a reason, not a budget.
                </p>
              </Reveal>

              {/* Metadata ledger, offset so it sits under the introduction. */}
              <Reveal delay={0.16} className="sm:col-span-5">
                <p className="text-meta text-accent-ink">At a glance</p>
                <dl className="mt-1">
                  {[
                    { label: "Focus", value: "Meta Ads planning" },
                    { label: "Based in", value: profile.location },
                    { label: "Availability", value: profile.remoteAvailability },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border-t border-border/90 py-3 last:border-b"
                    >
                      <dt className="text-meta text-muted-text">{item.label}</dt>
                      <dd className="mt-1 text-[0.9375rem] font-medium text-foreground">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            <Reveal delay={0.2}>
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3">
                <Link href="#contact" className="cta-primary">
                  Start a project
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 8h12M9 3l5 5-5 5" />
                  </svg>
                </Link>
                <Link href="#campaigns" className="cta-secondary">
                  See selected campaigns
                </Link>
              </div>
            </Reveal>
          </div>

          {/* — Portrait: columns 8–12, dropped below the headline — */}
          <div className="lg:col-span-5 lg:pt-4">
            <Reveal delay={0.12}>
              <div className="relative">
                <Figure ratio="4 / 5" className="overflow-hidden">
                  <Image
                    src="/images/portrait-k-nyi.jpg"
                    alt="Khant Nyi Nyi, independent performance marketer, photographed outdoors against green hills"
                    fill
                    priority
                    sizes="(min-width: 1024px) 38vw, (min-width: 640px) 60vw, 92vw"
                    className="object-cover"
                  />
                </Figure>

                {/* Teal keyline offset behind the plate — depth without a
                    drop shadow. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 -right-3 -z-10 h-24 w-24 border-b-2 border-r-2 border-accent-primary/70"
                />
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-border pt-3">
                <p className="text-[0.9375rem] font-medium text-foreground">
                  {profile.name}
                </p>
                <p className="figure-caption text-muted-text">
                  {profile.professionalName} · Yangon
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-text">
                {profile.remoteAvailability} — available for freelance projects
                and collaborations.
              </p>
            </Reveal>
          </div>
        </div>

        {/* — Process line: the method, stated up front — */}
        <Reveal delay={0.24}>
          <div className="mt-12 border-t border-border pt-4 md:mt-16">
            <p className="text-meta text-accent-ink">Working method</p>
            <ol className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              {PROCESS_LINE.map((step, i) => (
                <li key={step} className="flex items-baseline gap-3">
                  {i > 0 ? (
                    <span
                      aria-hidden="true"
                      className="text-[0.8125rem] text-accent-ink"
                    >
                      /
                    </span>
                  ) : null}
                  <span className="text-[0.9375rem] font-medium tracking-tight text-foreground">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}