import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="py-12 px-6 bg-bg-dark border-t border-border/30"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span
              className="font-geist-sans text-accent-primary text-lg font-medium"
            >
              K-Nyi
            </span>
          </div>

          <p className="text-muted/60 text-sm md:text-base">
            Performance Marketing
          </p>

          <p className="text-muted/60 text-sm md:ml-4">
            Diagnose First. Strategize Better. Optimize for Growth.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <Link
            className="font-geist-sans text-muted/60 hover:text-accent-primary transition-colors"
            href="#about"
          >
            About
          </Link>
          <Link
            className="font-geist-sans text-muted/60 hover:text-accent-primary transition-colors"
            href="#expertise"
          >
            Expertise
          </Link>
          <Link
            className="font-geist-sans text-muted/60 hover:text-accent-primary transition-colors"
            href="#campaigns"
          >
            Work
          </Link>
          <Link
            className="font-geist-sans text-muted/60 hover:text-accent-primary transition-colors"
            href="#contact"
          >
            Contact
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-border/30">
          <p className="text-xs text-muted/50">
            © {year} K-Nyi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
