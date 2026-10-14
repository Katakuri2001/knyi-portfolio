import { Reveal } from "@/components/Reveal";

function CheckIcon({ muted }: { muted?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`mt-1 h-4 w-4 flex-none ${
        muted ? "text-muted-text opacity-70" : "text-accent-ink"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ToolsSection() {
  return (
    <section id="tools" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <Reveal>
        <p className="font-method mb-6 text-xs uppercase tracking-[0.18em] text-accent-secondary">
          Tools &amp; capabilities
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <h2 className="mb-12 font-geist-sans text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl">
          Practical tools
        </h2>
      </Reveal>

      <div className="grid gap-12 md:grid-cols-2">
        <Reveal delay={0.1}>
          <div>
            <h3 className="mb-6 font-geist-sans text-lg font-bold">
              Practical exposure
            </h3>
            <ul className="space-y-3.5 text-muted-text">
              {[
                "Meta Ads Manager",
                "Canva",
                "Google Sheets",
                "ChatGPT",
                "Facebook Marketing",
                "Meta Pixel",
                "UTM parameters",
              ].map((tool) => (
                <li key={tool} className="flex items-start gap-3">
                  <CheckIcon />
                  <span>{tool}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div>
            <h3 className="mb-6 font-geist-sans text-lg font-bold">
              Currently learning
            </h3>
            <ul className="space-y-3.5 text-muted-text">
              {["GA4", "GTM", "Google Ads / SEM", "TikTok Ads", "SEO fundamentals"].map(
                (tool) => (
                  <li key={tool} className="flex items-start gap-3">
                    <CheckIcon muted />
                    <span>{tool}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}