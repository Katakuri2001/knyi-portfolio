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
    <section id="contact" className="section-lead scroll-mt-24 bg-bg-dark">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-eyebrow mb-8 flex items-center gap-4 text-accent-primary">
            <span className="h-px w-12 bg-accent-primary/40" aria-hidden="true" />
            Get in touch
          </p>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal delay={0.06} className="lg:col-span-7">
            <h2 className="text-title text-white">
              Let&apos;s talk
              <br />
              about your campaign.
            </h2>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
            <p className="text-lede text-on-dark/70">
              Available for freelance projects and collaborations. If a campaign
              needs clearer strategy, a tighter audience definition, or a more
              honest read on what is working, I would like to hear about it.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <dl className="mt-20 grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {CHANNELS.map((channel) => (
              <div key={channel.label} className="bg-bg-dark p-6 md:p-8">
                <dt className="text-eyebrow text-on-dark-muted">
                  {channel.label}
                </dt>
                <dd className="mt-3">
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
          <p className="mt-16 text-sm text-on-dark-muted">
            <strong className="font-medium text-on-dark">K-Nyi</strong> —
            Independent performance marketing &amp; media buying
          </p>
        </Reveal>
      </div>
    </section>
  );
}