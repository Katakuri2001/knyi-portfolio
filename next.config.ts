import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Two build targets.
 *
 * - `npm run build` — the full application. Node runtime, API routes, ISR and
 *   the admin console. Use this for a VPS, a container, or any Node host.
 * - `npm run build:pages` — a static export for GitHub Pages. There is no
 *   server, so there are no API routes and the console cannot sign anyone in:
 *   the admin becomes a **local-only** tool, and content changes ship by
 *   commit and push.
 *
 * `NEXT_TARGET=pages` selects the second. `NEXT_PUBLIC_BASE_PATH` carries the
 * repository sub-path, because a project Pages site is served from
 * `https://<user>.github.io/<repo>/` rather than from the domain root.
 */

const isPages = process.env.NEXT_TARGET === "pages";
const isCloudflare = process.env.NEXT_TARGET === "cloudflare";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// In development, this wires the D1 and R2 bindings into `next dev`, so the
// console talks to a local database exactly as it will to the deployed one.
// It is a no-op outside development, and it is not called at all when the
// OpenNext package is absent.
if (process.env.NODE_ENV === "development") {
  try {
    initOpenNextCloudflareForDev();
  } catch {
    // The Cloudflare bindings are optional locally; the SQLite file is used.
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // better-sqlite3 is a native module — it must not be bundled.
  serverExternalPackages: ["better-sqlite3"],

  // The image optimiser needs a server, and it needs one that will return
  // the image *inline*. On Cloudflare the optimiser goes through the Workers
  // Images binding, and for a locally-hosted source it comes back with
  // `Content-Disposition: attachment` — so the browser downloads the file
  // instead of drawing it, and the page shows a broken image.
  //
  // The originals are served instead. The site has three images, the largest
  // of which is 157 KB, so there is nothing to gain from resizing them, and
  // this is what the Pages export already does.
  ...(isPages || isCloudflare ? { images: { unoptimized: true } } : {}),

  ...(isPages
    ? {
        output: "export" as const,
        // A separate build directory, so exporting for Pages can never
        // overwrite the server build that `npm start` is running from.
        distDir: ".next-pages",
        // A project Pages site lives under a sub-path; a custom domain does
        // not. Set NEXT_PUBLIC_BASE_PATH to "" once a domain is attached.
        ...(basePath
          ? { basePath, assetPrefix: `${basePath}/` }
          : {}),
        // GitHub Pages serves directory-style URLs.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
