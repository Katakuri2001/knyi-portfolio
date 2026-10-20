import type { Metadata, Viewport } from "next";
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

/**
 * 158 characters — inside the ~160 a search result shows before truncating.
 * The SEO audit checks this length and reports it, so the number is measured
 * rather than guessed.
 */
const DESCRIPTION =
  "Khant Nyi Nyi (K-Nyi) — independent performance marketer specialising in Meta Ads planning, media buying, content strategy and campaign optimisation.";

/**
 * The production domain is not configured in this repository, so no canonical
 * URL is hardcoded here — inventing one would be worse than omitting it. Set
 * NEXT_PUBLIC_SITE_URL when deploying and the canonical URL, `og:url` and
 * `twitter:url` all switch on automatically.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

/**
 * The absolute origin the site is served from, used to resolve Open Graph and
 * Twitter image URLs. On GitHub Pages that is
 * `https://<user>.github.io/<repo>`, so it carries the base path too.
 */
const PUBLIC_ORIGIN =
  SITE_URL ??
  (process.env.NEXT_PUBLIC_BASE_PATH
    ? `https://katakuri2001.github.io${process.env.NEXT_PUBLIC_BASE_PATH}`
    : undefined);

export const metadata: Metadata = {
  ...(PUBLIC_ORIGIN ? { metadataBase: new URL(PUBLIC_ORIGIN) } : {}),
  title: {
    default: "K-Nyi — Performance Marketing & Media Buying",
    template: "%s — K-Nyi",
  },
  description: DESCRIPTION,
  applicationName: "K-Nyi Portfolio",
  authors: [{ name: "Khant Nyi Nyi" }],
  creator: "Khant Nyi Nyi",
  keywords: [
    "performance marketing",
    "media buying",
    "Meta Ads planning",
    "content strategy",
    "marketing analysis",
    "campaign optimization",
    "K-Nyi",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // Only emitted when the origin is actually known — inventing a canonical
  // URL would be worse than omitting one.
  ...(PUBLIC_ORIGIN ? { alternates: { canonical: "/" } } : {}),
  openGraph: {
    type: "profile",
    siteName: "K-Nyi Portfolio",
    title: "K-Nyi — Performance Marketing, Meta Ads Planning & Media Buying",
    description: DESCRIPTION,
    locale: "en",
    images: [
      {
        url: "/images/portrait-k-nyi.jpg",
        width: 1000,
        height: 1250,
        alt: "Khant Nyi Nyi, independent performance marketer",
      },
    ],
    ...(SITE_URL ? { url: SITE_URL } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "K-Nyi — Performance Marketing, Meta Ads Planning & Media Buying",
    description: DESCRIPTION,
    images: ["/images/portrait-k-nyi.jpg"],
    ...(SITE_URL ? { url: SITE_URL } : {}),
  },
};

/**
 * Honest structured data: name and the documented positioning line only.
 * No aggregateRating, no review, no job title beyond what the site itself
 * states, no invented credentials. `url` is deliberately omitted because the
 * production domain is not configured in this repository.
 */
const PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Khant Nyi Nyi",
  alternateName: "K-Nyi",
  description:
    "Independent performance marketer working across Meta Ads planning, media buying, content strategy and marketing analysis.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e6e9ee",
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
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          // Content is a static, locally-authored constant — no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
        />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-cta focus:px-5 focus:py-3 focus:text-on-cta"
        >
          Skip to content
        </a>

        {/* The public chrome — atmosphere, floating rail, main — lives in the
            (site) route group so the private /admin console does not inherit
            it. Both groups render an element with id="main" for the skip link. */}
        {children}
      </body>
    </html>
  );
}