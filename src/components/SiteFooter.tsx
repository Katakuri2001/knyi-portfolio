import { getProfile } from "@/lib/content";

/**
 * Footer — continues the closing dark room rather than starting a new one, so
 * the page ends as a single deliberate block.
 */

const FOOTER_LINKS = [
  { href: "#about", label: "About" },
  { href: "#expertise", label: "Expertise" },
  { href: "#campaigns", label: "Work" },
  { href: "#approach", label: "Approach" },
  { href: "#tools", label: "Tools" },
  { href: "#education", label: "Education" },
  { href: "#contact", label: "Contact" },
];

export async function SiteFooter() {
  const profile = await getProfile();
  const year = new Date().getFullYear();

  return (
    <footer className="room-dark border-t border-white/10">
      <div className="shell py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-subtitle text-white">{profile.professionalName}</p>
            <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-on-dark-muted">
              {profile.positioning}
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-7 md:justify-self-end">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-2 text-[0.875rem] text-on-dark/80 underline-offset-4 transition-colors duration-200 hover:text-accent-primary hover:underline"
                  >
                    <span aria-hidden="true" className="block h-px w-3 bg-current opacity-50" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-meta text-on-dark-muted">
            © {year} {profile.name}
          </p>
          <p className="text-meta text-on-dark-muted">
            {profile.location} · {profile.remoteAvailability}
          </p>
        </div>
      </div>
    </footer>
  );
}