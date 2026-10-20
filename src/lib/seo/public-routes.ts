/**
 * The site's public routes.
 *
 * One list, used by the technical SEO audit, the sitemap, the metadata editor
 * and the robots configuration. Nothing else may decide what is public — that
 * is how a private route ends up in a sitemap.
 *
 * The portfolio is a single page with anchor sections, so a "route" here is
 * the page plus the section anchors a visitor can land on.
 */

export type PublicSection = {
  /** The anchor id, e.g. "about". */
  id: string;
  /** The heading, used as the page title for a section-level override. */
  title: string;
};

export type PublicRoute = {
  /** The site-relative path. */
  path: string;
  /** The document title, when known. */
  title: string;
  /** The section anchors on the page. */
  sections: PublicSection[];
  /** Whether this route is in the sitemap. */
  inSitemap: boolean;
};

/**
 * The public surface. The admin console and every API route are excluded by
 * construction — they are not in this list, so nothing can add them by
 * accident.
 */
export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: "/",
    title: "K-Nyi — Performance Marketing, Meta Ads Planning & Media Buying",
    inSitemap: true,
    sections: [
      { id: "top", title: "Introduction" },
      { id: "about", title: "Background" },
      { id: "expertise", title: "Core capabilities" },
      { id: "campaigns", title: "Selected campaigns" },
      { id: "approach", title: "Working method" },
      { id: "tools", title: "Tools & capabilities" },
      { id: "education", title: "Education & professional development" },
      { id: "contact", title: "Get in touch" },
    ],
  },
];

export function publicPaths(): string[] {
  return PUBLIC_ROUTES.map((route) => route.path);
}

/** Paths that must never be crawled, indexed or listed. */
export const PRIVATE_PREFIXES = ["/admin", "/api", "/_next"];

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Every anchor a visitor can land on, for the internal-link check. */
export function knownAnchors(): Set<string> {
  const anchors = new Set<string>();
  for (const route of PUBLIC_ROUTES) {
    for (const section of route.sections) anchors.add(section.id);
  }
  // The skip link targets the page's <main>, which is a real destination.
  anchors.add("main");
  return anchors;
}
