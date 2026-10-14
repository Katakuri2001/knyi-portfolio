"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "#about", label: "About", index: "01" },
  { href: "#expertise", label: "Expertise", index: "02" },
  { href: "#campaigns", label: "Work", index: "03" },
  { href: "#approach", label: "Approach", index: "04" },
  { href: "#contact", label: "Contact", index: "05" },
];

const GLASS =
  "border border-white/25 bg-white/72 shadow-[0_18px_40px_-18px_rgb(2_31_63/0.28)] backdrop-blur-xl backdrop-saturate-150";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            onClick={onNavigate}
            className="group relative flex items-center gap-3 overflow-hidden rounded-full px-4 py-2.5 transition-all duration-300 ease-out hover:bg-white/70 focus-visible:bg-white/70 lg:py-2"
          >
            {/* Accent bar that grows from the centre on hover. */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-full bg-accent-ink transition-all duration-300 ease-out group-hover:h-6 group-focus-visible:h-6"
            />
            <span className="font-method w-5 flex-none text-[0.625rem] text-accent-secondary opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 lg:w-0 lg:overflow-hidden">
              {link.index}
            </span>
            <span className="font-geist-sans whitespace-nowrap text-sm text-foreground transition-transform duration-300 ease-out group-hover:translate-x-0.5 lg:group-hover:translate-x-1">
              {link.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Floating glass sidebar.
 *
 * Sized to its content rather than stretched full-height: it hugs the links with
 * vertical padding and sits inset from the viewport edge. The mobile variant
 * collapses to a pill toggle that expands the same panel in place, so there is
 * one nav implementation rather than two divergent ones.
 */
export function SiteNavigation() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Highlight the section currently in view.
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = LINKS.map((link) =>
      document.querySelector<HTMLElement>(link.href)
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5] }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Desktop: inset floating rail on the left, vertically centred. */}
      <header className="pointer-events-none fixed left-6 top-1/2 z-50 hidden -translate-y-1/2 lg:block">
        <div
          className={`pointer-events-auto flex flex-col rounded-full p-3 ${GLASS}`}
        >
          <Link
            href="#top"
            className="group mb-2 flex items-center justify-center rounded-full px-4 py-2 transition-colors duration-300 hover:bg-white/70"
          >
            <span className="font-geist-sans text-base font-semibold tracking-wider text-accent-secondary transition-colors duration-300 group-hover:text-accent-ink">
              K-Nyi
            </span>
          </Link>

          <div className="h-px w-full bg-black/10" aria-hidden="true" />

          <nav aria-label="Primary" className="pt-2">
            <NavLinks />
          </nav>

          <span
            aria-hidden="true"
            className="mt-2 flex items-center justify-center gap-1.5 pt-2"
          >
            {LINKS.map((link) => (
              <span
                key={link.href}
                className={`h-1 w-1 rounded-full transition-all duration-300 ${
                  active === link.href
                    ? "w-4 bg-accent-ink"
                    : "bg-black/20"
                }`}
              />
            ))}
          </span>
        </div>
      </header>

      {/* Mobile: collapsed pill that expands the panel in place. */}
      <header className="fixed left-4 top-4 z-50 lg:hidden">
        <div className={`flex flex-col rounded-2xl ${GLASS}`}>
          <div className="flex items-center gap-2">
            <Link
              href="#top"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-geist-sans text-base font-semibold tracking-wider text-accent-secondary transition-colors duration-300 hover:text-accent-ink"
            >
              K-Nyi
            </Link>

            <span
              aria-hidden="true"
              className="h-6 w-px bg-black/10"
            />

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground transition-colors duration-300 hover:bg-white/70"
            >
              <svg
                className="h-5 w-5 transition-transform duration-300 ease-out"
                style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
              >
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>

          <div
            id="mobile-nav"
            className={`grid transition-all duration-300 ease-out ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <nav aria-label="Mobile" className="px-2 pb-2 pt-1">
                <NavLinks onNavigate={() => setOpen(false)} />
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}