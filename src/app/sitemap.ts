import type { MetadataRoute } from "next";

/**
 * The public site is a single page whose sections are anchors, so the sitemap
 * lists the one indexable URL. `/admin` is excluded — see robots.ts.
 *
 * No canonical domain is hardcoded: the production domain is not configured in
 * this repository, so nothing is invented here. Set `NEXT_PUBLIC_SITE_URL` and
 * both this file and the canonical tag switch on.
 */
/** Prerendered file, for the same reason as robots.ts. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  if (!base) return [];
  const origin = base.replace(/\/+$/, "");

  return [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}