import Link from "next/link";

const FOOTER_LINKS = [
  { href: "#about", label: "About" },
  { href: "#expertise", label: "Expertise" },
  { href: "#campaigns", label: "Work" },
  { href: "#approach", label: "Approach" },
  { href: "#contact", label: "Contact" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-bg-dark">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-geist-sans text-lg font-medium tracking-wider text-accent-primary">
              K-Nyi
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-on-dark-muted">
              Diagnose First. Strategize Better. Optimize for Growth.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-geist-sans text-sm text-on-dark/70 underline-offset-4 transition-colors hover:text-accent-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-white/10 pt-8 text-xs text-on-dark-muted">
          © {year} Khant Nyi Nyi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}