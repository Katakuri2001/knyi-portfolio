"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CONSOLE_SECTIONS } from "@/components/admin/nav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { withBasePath } from "@/lib/paths";

/**
 * The console shell.
 *
 * The navigation is a **floating glass panel** on desktop, matching the
 * language of the public site's rail, and a drawer on small screens. The
 * content column is offset to clear the panel, so the two never overlap.
 *
 * The panel is the only large glass surface in the console. Buttons and filter
 * controls use the lighter grades — enough material to read as a system,
 * without turning every row of a data table into a frosted rectangle.
 */
export function ConsoleShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current =
    CONSOLE_SECTIONS.find(
      (section) =>
        section.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(section.href)
    ) ?? CONSOLE_SECTIONS[0];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Mobile bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src={withBasePath("/images/mark-k-nyi.png")}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 flex-none"
          />
          <span className="text-[0.8125rem] font-semibold text-accent-secondary">
            {title}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="console-nav"
          className="glass-surface flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.8125rem] text-foreground"
        >
          {open ? "Close" : "Menu"}
          <span aria-hidden="true" className="font-geist-mono text-[0.75rem]">
            {open ? "×" : "≡"}
          </span>
        </button>
      </header>

      <div className="lg:pl-[17.5rem]">
        {/* Desktop: a floating glass panel, inset from the edge. */}
        <nav
          aria-label="Console"
          className="pointer-events-none fixed inset-y-4 left-4 z-30 hidden w-60 lg:block"
        >
          <div className="glass-panel pointer-events-auto flex h-full flex-col overflow-y-auto rounded-2xl p-4">
            <Link
              href="/admin"
              className="mb-6 flex items-center gap-2.5 border-b border-rule/15 pb-4"
            >
              <Image
                src={withBasePath("/images/mark-k-nyi.png")}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 flex-none"
              />
              <span className="flex flex-col">
                <span className="text-[0.8125rem] font-semibold tracking-tight text-accent-secondary">
                  K-Nyi — Admin
                </span>
                <span className="text-meta text-muted-text">
                  Marketing intelligence
                </span>
              </span>
            </Link>

            <ul className="flex-1 space-y-0.5">
              {CONSOLE_SECTIONS.map((section) => {
                const active = current.key === section.key;
                return (
                  <li key={section.key}>
                    <Link
                      href={section.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "flex items-baseline gap-2 rounded-sm px-2.5 py-2 text-[0.875rem] transition-colors duration-150",
                        active
                          ? "bg-white/70 font-semibold text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]"
                          : "text-muted-text hover:bg-white/45 hover:text-foreground",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-1 block h-3 w-[2px] flex-none",
                          active ? "bg-accent-ink" : "bg-transparent",
                        ].join(" ")}
                      />
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 space-y-2 border-t border-rule/15 pt-4">
              {/* No prefetch: this leaves the console for a different page, so
                  the payload of the whole public site is not worth fetching in
                  advance — and the open connection it leaves behind ties up a
                  request on every console page. */}
              <Link
                href="/"
                prefetch={false}
                className="block text-[0.8125rem] text-muted-text transition-colors hover:text-accent-ink"
              >
                View public site ↗
              </Link>
              <SignOutButton className="block text-left text-[0.8125rem] text-muted-text transition-colors hover:text-accent-ink" />
            </div>
          </div>
        </nav>

        {/* Mobile drawer — the same glass, as a sheet. */}
        {open ? (
          <nav
            id="console-nav"
            aria-label="Console"
            className="glass-bar mx-3 mt-3 overflow-hidden rounded-2xl lg:hidden"
          >
            <ul className="divide-y divide-rule/10">
              {CONSOLE_SECTIONS.map((section) => {
                const active = current.key === section.key;
                return (
                  <li key={section.key}>
                    <Link
                      href={section.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block px-4 py-3 text-[0.9375rem]",
                        active
                          ? "bg-white/60 font-semibold text-foreground"
                          : "text-muted-text",
                      ].join(" ")}
                    >
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-5 border-t border-rule/10 px-4 py-3">
              <Link
                href="/"
                prefetch={false}
                className="text-[0.8125rem] text-muted-text"
              >
                Public site ↗
              </Link>
              <SignOutButton className="text-[0.8125rem] text-muted-text" />
            </div>
          </nav>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
