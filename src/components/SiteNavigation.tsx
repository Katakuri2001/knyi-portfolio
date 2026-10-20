"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { withBasePath } from "@/lib/paths";

/* ---------------------------------------------------------------------------
   Rail collapse preference

   localStorage is an external store, so it is read through
   useSyncExternalStore rather than an effect: React uses the server snapshot
   during hydration, so the markup matches on first paint and the stored
   preference is applied immediately afterwards.
   --------------------------------------------------------------------------- */
const RAIL_KEY = "knyi-rail-state";
const RAIL_EVENT = "knyi-rail-change";
type RailState = "expanded" | "collapsed";

function readRail(): RailState {
  try {
    return window.localStorage.getItem(RAIL_KEY) === "collapsed"
      ? "collapsed"
      : "expanded";
  } catch {
    return "expanded";
  }
}

function subscribeRail(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(RAIL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(RAIL_EVENT, onChange);
  };
}

function writeRail(state: RailState) {
  try {
    window.localStorage.setItem(RAIL_KEY, state);
  } catch {
    /* storage unavailable — the preference simply will not persist */
  }
  window.dispatchEvent(new Event(RAIL_EVENT));
}

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Shown in the mobile dock. */
  dock?: boolean;
};

const ICONS = {
  home: <path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-5.2v-6.2H9.2V21H5a1 1 0 0 1-1-1v-8.8Z" />,
  about: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.5c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
    </>
  ),
  expertise: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.4" />
    </>
  ),
  work: (
    <>
      <rect x="3.5" y="7" width="17" height="13" rx="2" />
      <path d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7" />
    </>
  ),
  approach: (
    <>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="12" cy="17" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <path d="M8 8.2 10.4 15M13.6 15 16 8.2" />
    </>
  ),
  tools: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" />
    </>
  ),
  education: (
    <>
      <path d="M3.5 8.5 12 4.5l8.5 4-8.5 4z" />
      <path d="M7 11v4.2c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6V11" />
      <path d="M20.5 8.5v5" />
    </>
  ),
  contact: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </>
  ),
};

const LINKS: NavItem[] = [
  { href: "#top", label: "Home", icon: ICONS.home, dock: true },
  { href: "#about", label: "About", icon: ICONS.about, dock: true },
  { href: "#expertise", label: "Expertise", icon: ICONS.expertise },
  { href: "#campaigns", label: "Work", icon: ICONS.work, dock: true },
  { href: "#approach", label: "Approach", icon: ICONS.approach },
  { href: "#tools", label: "Tools", icon: ICONS.tools },
  { href: "#education", label: "Education", icon: ICONS.education },
  { href: "#contact", label: "Contact", icon: ICONS.contact, dock: true },
];

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="h-[1.05rem] w-[1.05rem] flex-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * Shared link list. The active item is signalled three ways — filled surface,
 * teal bar, teal index numeral, plus `aria-current` — so the state never
 * depends on colour alone.
 */
function NavLinks({
  onNavigate,
  active,
}: {
  onNavigate?: () => void;
  active: string;
}) {
  return (
    <ul className="flex flex-col">
      {LINKS.map((link) => {
        const isActive = active === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive ? "location" : undefined}
              className={[
                "nav-link group relative",
                isActive ? "nav-item-active" : "hover:bg-white/50 focus-visible:bg-white/50",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "nav-bar absolute left-1 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full",
                  isActive
                    ? "bg-accent-ink"
                    : "bg-accent-secondary/60 group-hover:bg-accent-ink",
                ].join(" ")}
              />

              <span
                className={isActive ? "text-accent-ink" : "text-accent-secondary/75"}
              >
                <NavIcon>{link.icon}</NavIcon>
              </span>

              <span className="nav-body flex min-w-0 flex-1 items-baseline">
                <span
                  className={[
                    "nav-label truncate text-[0.8125rem] tracking-tight transition-colors duration-200",
                    isActive
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/78 group-hover:text-foreground",
                  ].join(" ")}
                >
                  {link.label}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SiteNavigation() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#top");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();

  const collapsed =
    useSyncExternalStore(subscribeRail, readRail, () => "expanded") ===
    "collapsed";

  /* Publish the state on <html> so the CSS custom properties that drive both
     the rail width and the content gutter react to it. Declared here rather
     than in an effect so there is no frame where the two disagree. */
  const applyRailState = useCallback((state: RailState) => {
    document.documentElement.dataset.rail = state;
  }, []);

  useEffect(() => {
    applyRailState(collapsed ? "collapsed" : "expanded");
  }, [collapsed, applyRailState]);

  const toggleCollapsed = useCallback(() => {
    writeRail(collapsed ? "expanded" : "collapsed");
  }, [collapsed]);

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
      { rootMargin: "-42% 0px -46% 0px", threshold: [0, 0.25, 0.5] }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const dockLinks = LINKS.filter((link) => link.dock);

  return (
    <>
      {/* Desktop — floating vertical rail, vertically centred, inset from the
          left edge. Sized to its content so it never dominates the page, and
          collapsible to an icon column. Collapsing also narrows the layout
          gutter (see --rail in globals.css), so the content measure grows. */}
      <header className="pointer-events-none fixed left-6 top-1/2 z-50 hidden -translate-y-1/2 lg:block">
        <div
          className="glass-rail rail pointer-events-auto relative flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-y-auto p-2"
          data-collapsed={collapsed}
        >
          <Link
            href="#top"
            aria-label="K-Nyi — back to top"
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors duration-200 hover:bg-white/55"
          >
            <Image
              src={withBasePath("/images/mark-k-nyi.png")}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 flex-none"
              priority
            />
            <span className="rail-brand-text flex min-w-0 flex-col">
              <span className="text-[0.8125rem] font-semibold tracking-tight text-accent-secondary">
                K-Nyi
              </span>
              <span className="text-[0.625rem] font-medium leading-tight tracking-[0.1em] text-muted-text">
                Performance marketer
              </span>
            </span>
          </Link>

          <div className="mx-2.5 h-px bg-black/10" aria-hidden="true" />

          <nav aria-label="Primary" className="pt-1.5">
            <NavLinks active={active} />
          </nav>

          <div className="mx-2.5 h-px bg-black/10" aria-hidden="true" />

          <div className="rail-footer-wrap">
            <p className="px-2.5 py-2.5 text-[0.625rem] font-medium leading-[1.7] tracking-[0.08em] text-muted-text">
              Yangon, Myanmar
              <br />
              Remote / WFH
            </p>
          </div>

          <div className="mx-2.5 h-px bg-black/10" aria-hidden="true" />

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="rail-toggle"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12.5 5 7.5 10l5 5" />
            </svg>
            <span className="rail-toggle-label">
              {collapsed ? "Expand" : "Collapse"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile — compact glass dock pinned to the bottom with safe-area
          padding; "All sections" expands into a sheet above it. */}
      <header className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
        {open ? (
          <button
            type="button"
            className="pointer-events-auto absolute inset-x-0 -top-[100dvh] h-[100dvh] bg-ink/25"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="pointer-events-auto mx-3 mb-[calc(0.6rem+env(safe-area-inset-bottom))] flex flex-col gap-2 sm:mx-5">
          <div
            id={sheetId}
            hidden={!open}
            className="glass-pill relative overflow-hidden p-2"
          >
            <nav aria-label="All sections">
              <NavLinks active={active} onNavigate={() => setOpen(false)} />
            </nav>
          </div>

          <nav
            aria-label="Primary"
            className="glass-pill relative flex items-stretch justify-between gap-0.5 px-1.5 py-1.5"
          >
            {dockLinks.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "location" : undefined}
                  className="flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[0.625rem] font-medium tracking-tight transition-colors duration-200"
                >
                  <span
                    className={isActive ? "text-accent-ink" : "text-accent-secondary/75"}
                  >
                    <NavIcon>{link.icon}</NavIcon>
                  </span>
                  <span
                    className={[
                      "flex flex-col items-center gap-1",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-foreground/75",
                    ].join(" ")}
                  >
                    {link.label}
                    {/* Second, non-colour signal for the active dock item. */}
                    <span
                      aria-hidden="true"
                      className="h-[3px] w-3.5 rounded-full transition-colors duration-200"
                      style={{
                        background: isActive
                          ? "var(--color-accent-ink)"
                          : "transparent",
                      }}
                    />
                  </span>
                </Link>
              );
            })}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={sheetId}
              aria-label={open ? "Close menu" : "Open full menu"}
              className="flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[0.625rem] font-medium tracking-tight text-foreground/75 transition-colors duration-200"
            >
              <svg
                className="h-[1.05rem] w-[1.05rem]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                aria-hidden="true"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M5 7h14M5 12h14M5 17h10" />
                )}
              </svg>
              <span className="flex flex-col items-center gap-1">
                Menu
                <span
                  aria-hidden="true"
                  className="h-[3px] w-3.5 rounded-full"
                  style={{
                    background: open ? "var(--color-accent-ink)" : "transparent",
                  }}
                />
              </span>
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}