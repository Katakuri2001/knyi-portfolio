import { Reveal } from "@/components/Reveal";

const CHANNELS = [
  {
    label: "Email",
    value: "info@knyi-portfolio.local",
    href: "mailto:info@knyi-portfolio.local",
  },
  {
    label: "Telegram",
    value: "@knyi-portfolio",
    href: "https://t.me/knyi-portfolio",
    external: true,
  },
  {
    label: "Phone",
    value: "+95 997 3949 109",
    href: "tel:+959973949109",
  },
  { label: "Location", value: "Yangon, Myanmar" },
  { label: "Availability", value: "Remote / Work From Home" },
];

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-16 bg-bg-dark py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <p className="font-method text-xs uppercase tracking-[0.18em] text-accent-primary">
            Get in touch
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-6 mb-6 font-geist-sans text-4xl font-bold leading-[1.15] tracking-tight text-on-dark md:text-5xl">
            Let&apos;s talk about your campaign.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mb-12 max-w-xl text-lg leading-relaxed text-on-dark/70">
            I am available for freelance projects and collaborations. If you have a
            campaign that needs a clearer strategy, a tighter audience definition,
            or a more honest read on what is actually working, I would like to hear
            about it.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <dl className="grid gap-x-12 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-2">
            {CHANNELS.map((channel) => (
              <div key={channel.label}>
                <dt className="font-method text-xs uppercase tracking-[0.18em] text-on-dark-muted">
                  {channel.label}
                </dt>
                <dd className="mt-2">
                  {channel.href ? (
                    <a
                      href={channel.href}
                      {...(channel.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="font-geist-sans text-lg text-accent-primary underline-offset-4 transition-colors duration-200 hover:underline"
                    >
                      {channel.value}
                    </a>
                  ) : (
                    <span className="font-geist-sans text-lg text-on-dark">
                      {channel.value}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.22}>
          <p className="mt-12 border-t border-white/10 pt-8 text-sm text-on-dark-muted">
            <strong className="font-medium text-on-dark">K-Nyi</strong> —
            Independent performance marketing &amp; media buying
          </p>
        </Reveal>
      </div>
    </section>
  );
}