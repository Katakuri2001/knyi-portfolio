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
 * A fixed left rail on desktop, a collapsible drawer on small screens. The
 * public site uses a floating glass rail; the console uses a solid one, because
 * a data table needs a stable edge to read against and a floating panel over
 * scrolling data is harder to use than a docked one.
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
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 lg:hidden">
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
          className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-[0.8125rem] text-foreground"
        >
          {open ? "Close" : "Menu"}
          <span aria-hidden="true" className="font-geist-mono text-[0.75rem]">
            {open ? "×" : "≡"}
          </span>
        </button>
      </header>

      <div className="lg:flex">
        {/* Desktop rail */}
        <nav
          aria-label="Console"
          className="hidden w-60 flex-none border-r border-border bg-surface lg:block"
        >
          <div className="sticky top-0 flex h-dvh flex-col overflow-y-auto p-4">
            <Link
              href="/admin"
              className="mb-6 flex items-center gap-2.5 border-b border-border pb-4"
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
                          ? "bg-accent-ink/10 font-semibold text-foreground"
                          : "text-muted-text hover:bg-accent-ink/5 hover:text-foreground",
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

            <div className="mt-6 space-y-2 border-t border-border pt-4">
              <Link
                href="/"
                className="block text-[0.8125rem] text-muted-text transition-colors hover:text-accent-ink"
              >
                View public site ↗
              </Link>
              <SignOutButton className="block text-left text-[0.8125rem] text-muted-text transition-colors hover:text-accent-ink" />
            </div>
          </div>
        </nav>

        {/* Mobile drawer */}
        {open ? (
          <nav
            id="console-nav"
            aria-label="Console"
            className="border-b border-border bg-surface lg:hidden"
          >
            <ul className="divide-y divide-border">
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
                          ? "font-semibold text-foreground"
                          : "text-muted-text",
                      ].join(" ")}
                    >
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-5 border-t border-border px-4 py-3">
              <Link
                href="/"
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
