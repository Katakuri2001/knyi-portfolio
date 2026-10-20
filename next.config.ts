import type { NextConfig } from "next";

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
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // better-sqlite3 is a native module — it must not be bundled.
  serverExternalPackages: ["better-sqlite3"],

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
        // The image optimiser needs a server. Static exports serve the
        // original file instead.
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
