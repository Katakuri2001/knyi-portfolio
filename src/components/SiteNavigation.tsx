import Link from "next/link";

export function SiteNavigation() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/[0.8] dark:bg-black/[0.6] border-b border-border/30"
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
        <Link
          className="font-geist-sans text-accent-secondary text-lg font-medium tracking-wider"
          href="/"
        >
          K-Nyi
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            className="font-geist-sans text-foreground hover:text-accent-primary transition-colors"
            href="#about"
          >
            About
          </Link>
          <Link
            className="font-geist-sans text-foreground hover:text-accent-primary transition-colors"
            href="#expertise"
          >
            Expertise
          </Link>
          <Link
            className="font-geist-sans text-foreground hover:text-accent-primary transition-colors"
            href="#campaigns"
          >
            Work
          </Link>
          <Link
            className="font-geist-sans text-foreground hover:text-accent-primary transition-colors"
            href="#approach"
          >
            Approach
          </Link>
          <Link
            className="font-geist-sans text-accent-primary font-medium transition-colors"
            href="#contact"
          >
            Contact
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-full hover:bg-border"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
