export function ContactSection() {
  return (
    <section
      className="py-24 md:py-32 bg-bg-dark px-6 max-w-2xl mx-auto"
    >
      <div className="max-w-2xl mx-auto">
        <p
          className="text-accent-secondary text-sm font-medium tracking-widest uppercase mb-8"
        >
          GET IN TOUCH
        </p>

        <h2 className="font-geist-sans text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight mb-8">
          Let Us Talk
        </h2>

        <p className="text-muted/60 mb-12">
          I am available for freelance projects and collaborations. Let us discuss
          how I can help your campaign move with purpose.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-12">
          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-4">Professional Details</h3>

            <div className="space-y-4">
              <div>
                <p className="font-medium text-muted/60">Email</p>
                <a
                  className="text-accent-primary hover:underline"
                  href="mailto:info@knyi-portfolio.local"
                >
                  info@knyi-portfolio.local
                </a>
              </div>

              <div>
                <p className="font-medium text-muted/60">Telegram</p>
                <a
                  className="text-accent-primary hover:underline"
                  href="https://t.me/knyi-portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @knyi-portfolio
                </a>
              </div>

              <div>
                <p className="font-medium text-muted/60">Phone</p>
                <a
                  className="text-accent-primary hover:underline"
                  href="tel:+959973949109"
                >
                  +95 997 3949 109
                </a>
              </div>

              <div>
                <p className="font-medium text-muted/60">Location</p>
                <p className="text-muted/60">Yangon, Myanmar</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-geist-sans text-xl font-bold mb-4">Remote Availability</h3>
            <p className="text-foreground font-medium">
              Remote / Work From Home
            </p>
          </div>
        </div>

        <div>
          <p className="mt-8 text-sm text-muted/60">
            <strong>Brand:</strong> K-Nyi | Performance Marketing & Media Buying
          </p>
        </div>
      </div>
    </section>
  );
}
