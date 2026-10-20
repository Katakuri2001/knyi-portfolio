import { SectionMarker } from "@/components/editorial";
import { Reveal } from "@/components/Reveal";
import { getProfile } from "@/lib/content";

/**
 * Contact — the closing room.
 *
 * Full-bleed deep navy so the page ends on a hard tonal change rather than a
 * trailing grey. The email is the primary action at display scale; the other
 * channels sit in a hairline ledger rather than in glass cards. All contact
 * details come from content/profile.json — none are invented here.
 */

export function ContactSection() {
  const profile = getProfile();
  const { email, telegram, phone } = profile.contact;

  return (
    <section id="contact" className="room-dark relative">
      <div className="shell section-lead">
        <Reveal>
          <SectionMarker index="07" label="Get in touch" tone="dark" />
        </Reveal>

        <div className="mt-12 grid gap-y-12 md:mt-16 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            <Reveal delay={0.05}>
              <h2 className="text-display text-white">
                Let&apos;s talk
                <br />
                {" "}about the{" "}
                <span className="text-accent-primary">campaign.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="text-lede mt-9 max-w-xl text-on-dark/78">
                Available for freelance projects and collaborations. If a
                campaign needs a clearer strategy, a tighter audience
                definition, or a more honest read on what is working, I would
                like to hear about it.
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="mt-12">
                <p className="text-eyebrow text-on-dark-muted">Email</p>
                <a
                  href={`mailto:${email}`}
                  className="group mt-3 inline-block min-h-11 py-2 text-subtitle text-accent-primary underline-offset-[6px] transition-colors duration-200 hover:text-white hover:underline md:text-[2rem]"
                >
                  {email}
                </a>
                <span aria-hidden="true" className="accent-rule mt-5" />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <dl className="border-t border-white/14">
                <div className="flex items-baseline justify-between gap-6 border-b border-white/14 py-4">
                  <dt className="text-meta text-on-dark-muted">Telegram</dt>
                  <dd>
                    <a
                      href={`https://t.me/${telegram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.9375rem] text-on-dark underline-offset-4 transition-colors duration-200 hover:text-accent-primary hover:underline"
                    >
                      {telegram}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-6 border-b border-white/14 py-4">
                  <dt className="text-meta text-on-dark-muted">Phone</dt>
                  <dd>
                    <a
                      href={phone.replace(/[^+\d]/g, "")}
                      className="text-[0.9375rem] text-on-dark underline-offset-4 transition-colors duration-200 hover:text-accent-primary hover:underline"
                    >
                      {phone}
                    </a>
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-6 border-b border-white/14 py-4">
                  <dt className="text-meta text-on-dark-muted">Location</dt>
                  <dd className="text-[0.9375rem] text-on-dark">
                    {profile.location}
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-6 border-b border-white/14 py-4">
                  <dt className="text-meta text-on-dark-muted">
                    Availability
                  </dt>
                  <dd className="text-right text-[0.9375rem] text-on-dark">
                    {profile.remoteAvailability}
                  </dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-10 border-t border-white/14 pt-6">
                <p className="text-meta text-on-dark-muted">Focus areas</p>
                <ul className="mt-3 space-y-1.5">
                  {[
                    "Meta Ads planning & media buying",
                    "Content strategy & planning",
                    "Marketing analysis & optimization",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-3 text-[0.9375rem] text-on-dark/85"
                    >
                      <span
                        aria-hidden="true"
                        className="block h-px w-3 flex-none bg-accent-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}