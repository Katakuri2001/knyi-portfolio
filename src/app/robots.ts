import type { MetadataRoute } from "next";

/**
 * robots.txt
 *
 * The public site is welcome in search results. `/admin` and `/api` are not:
 * they are the private console and its endpoints, and there is nothing in them
 * a crawler should be spending budget on.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    ...(base ? { sitemap: `${base.replace(/\/+$/, "")}/sitemap.xml` } : {}),
  };
}