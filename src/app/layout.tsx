import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [
    { path: "./fonts/geist-latin.woff2", weight: "100 900", style: "normal" },
    {
      path: "./fonts/geist-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "./fonts/geist-mono-latin.woff2", weight: "100 900", style: "normal" },
    {
      path: "./fonts/geist-mono-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "K-Nyi | Performance Marketing & Media Buying",
  description:
    "Khant Nyi Nyi (K-Nyi) - Independent Performance Marketer specializing in Meta Ads planning, media buying, content strategy, and campaign optimization.",
  keywords:
    "K-Nyi, performance marketing, media buying, meta ads, content strategy, campaign optimization, media buying, marketing analysis",
};

import { SiteNavigation } from "@/components/SiteNavigation";

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
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-cta focus:px-5 focus:py-3 focus:text-on-cta"
        >
          Skip to content
        </a>

        {/* The navigation lives in the layout rather than inside a section so
            it can overlay the page without being part of the content flow. */}
        <SiteNavigation />

        {/* lg:pl reserves room for the floating glass rail (left: 1.5rem plus
            ~8.25rem of width) so content never slides underneath it. */}
        <main id="main" className="flex-1 lg:pl-[13.5rem]">
          {children}
        </main>
      </body>
    </html>
  );
}
