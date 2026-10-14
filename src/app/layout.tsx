import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "K-Nyi | Performance Marketing & Media Buying",
  description:
    "Khant Nyi Nyi (K-Nyi) - Independent Performance Marketer specializing in Meta Ads planning, media buying, content strategy, and campaign optimization.",
  keywords:
    "K-Nyi, performance marketing, media buying, meta ads, content strategy, campaign optimization, media buying, marketing analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-background">
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

        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
