/**
 * Base path handling.
 *
 * A GitHub Pages **project** site is served from
 * `https://<user>.github.io/<repo>/`, not from the domain root, so every
 * public file needs the repository name in front of it.
 *
 * `next.config.ts` sets `basePath` and `assetPrefix`, which covers the
 * framework's own assets (`/_next/...`). It does **not** cover an
 * unoptimised image's `src`: there is no server to rewrite it, so Next emits
 * the raw path. On a project site that path 404s.
 *
 * `withBasePath` applies the prefix by hand. In the normal server build
 * `NEXT_PUBLIC_BASE_PATH` is unset and the function is a no-op, so nothing
 * changes there.
 */

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  if (!BASE_PATH) return path;
  if (!path.startsWith("/")) return path;
  if (path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}
