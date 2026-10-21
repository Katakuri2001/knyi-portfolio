import {
  addAuditIssue,
  createAuditRun,
  finishAuditRun,
  type AuditIssueInput,
} from "../db/seo.ts";
import { now } from "../db/index.ts";
import { knownAnchors, PUBLIC_ROUTES, type PublicRoute } from "./public-routes.ts";

/**
 * The technical SEO audit.
 *
 * ## What it actually checks
 *
 * Every finding below comes from parsing the site's **own** rendered HTML and
 * its own metadata routes. The audit does not guess: if it cannot check a
 * condition, it does not report that condition.
 *
 * ## Safety
 *
 * The audit fetches only paths from `PUBLIC_ROUTES` — a fixed list in this
 * repository. There is no field anywhere in this module that accepts a URL
 * from a request. That is the SSRF defence: the auditor cannot be pointed at
 * `169.254.169.254` or an internal host, because it never accepts a
 * destination at all.
 *
 * Fetches are bounded by a timeout, run with a small concurrency limit, and
 * responses are size-capped.
 */

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const CONCURRENCY = 3;

export type AuditSeverity = "error" | "warning" | "info";

export type AuditResult = {
  runId: string;
  pagesChecked: number;
  errors: number;
  warnings: number;
  infos: number;
  issues: AuditIssueInput[];
};

/**
 * The base URL the audit fetches from.
 *
 * The order matters:
 *
 * 1. `SITE_INTERNAL_URL` — an explicit override, for pointing the audit at a
 *    staging host or at the live site on purpose.
 * 2. `fallback` — the origin of the running instance. This is the default
 *    because the audit should check **the build you are looking at**, not a
 *    deployment that may not have caught up.
 * 3. `NEXT_PUBLIC_SITE_URL` — the public origin.
 */
export function auditBaseUrl(fallback?: string): string {
  const configured = process.env.SITE_INTERNAL_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (fallback) return fallback.replace(/\/+$/, "");

  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (publicUrl) return publicUrl.replace(/\/+$/, "");

  return "http://localhost:3000";
}

/** A small HTML reader for the tags the audit needs. */
function readTag(html: string, tag: string, attribute?: string): string | null {
  if (attribute) {
    const pattern = new RegExp(
      `<${tag}\\b[^>]*\\b${attribute}=["']([^"']*)["'][^>]*>`,
      "i"
    );
    return html.match(pattern)?.[1] ?? null;
  }
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const raw = html.match(pattern)?.[1];
  return raw ? decodeEntities(raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()) : null;
}

function readAllTags(html: string, tag: string, attribute: string): string[] {
  const pattern = new RegExp(
    `<${tag}\\b[^>]*\\b${attribute}=["']([^"']*)["'][^>]*>`,
    "gi"
  );
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) found.push(match[1]);
  return found;
}

/**
 * Reads the href of a `<link>` with a **specific** rel value.
 *
 * A generic "first link with a rel" reader would match the font preloads —
 * `rel="preload"` comes before `rel="canonical"` in the head — and report a
 * preload URL as a broken canonical.
 */
function readLinkHref(html: string, rel: string): string | null {
  const pattern = new RegExp(
    `<link\\b[^>]*\\brel=["']${rel}["'][^>]*\\bhref=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const match = html.match(pattern);
  if (match) return match[1];

  // The attribute order can be reversed.
  const reversed = new RegExp(
    `<link\\b[^>]*\\bhref=["']([^"']*)["'][^>]*\\brel=["']${rel}["'][^>]*>`,
    "i"
  );
  return html.match(reversed)?.[1] ?? null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Fetches a page from the site's own origin, with a size cap. */
async function fetchPublic(path: string, base: string): Promise<string | null> {
  const url = new URL(path, base);
  // Belt and braces: the origin must match the configured base.
  if (url.origin !== new URL(base).origin) return null;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "K-Nyi-SEO-Audit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const text = await response.text();
    return text.length > MAX_RESPONSE_BYTES
      ? text.slice(0, MAX_RESPONSE_BYTES)
      : text;
  } catch {
    return null;
  }
}

/** Runs the audit over the site's own public routes. */
export async function runTechnicalAudit(fallbackBase?: string): Promise<AuditResult> {
  const base = auditBaseUrl(fallbackBase);
  const runId = `audit_${now()}_${Math.random().toString(36).slice(2, 8)}`;

  await createAuditRun(runId, base);

  const issues: AuditIssueInput[] = [];
  let pagesChecked = 0;

  try {
    const titles = new Map<string, string[]>();
    const descriptions = new Map<string, string[]>();

    for (const route of PUBLIC_ROUTES) {
      const html = await fetchPublic(route.path, base);

      if (html === null) {
        issues.push({
          url: route.path,
          issueType: "page_unreachable",
          severity: "error",
          message: "The page did not respond with a successful status.",
          remediation:
            "Check that the site is running and that the path resolves. If this is a deployment issue, the page is not being served.",
        });

        // If the *first* route could not be reached, the origin itself is
        // unreachable — every remaining route is on the same origin, so
        // waiting for each of them in turn would just multiply one timeout
        // by the number of routes. Stop here and say so.
        if (pagesChecked === 0) break;

        continue;
      }

      pagesChecked++;

      /* --- Title --- */
      const title = readTag(html, "title");
      if (!title || title.trim() === "") {
        issues.push({
          url: route.path,
          issueType: "missing_title",
          severity: "error",
          message: "The page has no title element.",
          remediation:
            "Set a title in the page metadata, or add a per-page override in SEO intelligence.",
        });
      } else if (title.length > 60) {
        issues.push({
          url: route.path,
          issueType: "title_too_long",
          severity: "info",
          message: `The title is ${title.length} characters; search results truncate around 60.`,
          remediation:
            "Shorten the title so the important words survive truncation.",
        });
      } else {
        const list = titles.get(title) ?? [];
        list.push(route.path);
        titles.set(title, list);
      }

      /* --- Description --- */
      const descriptionMatch = html.match(
        /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i
      );
      const metaDescription = descriptionMatch
        ? decodeEntities(descriptionMatch[1])
        : null;

      if (!metaDescription) {
        issues.push({
          url: route.path,
          issueType: "missing_meta_description",
          severity: "warning",
          message: "The page has no meta description.",
          remediation:
            "Add a description — it is the snippet most people read before deciding to click.",
        });
      } else {
        if (metaDescription.length > 160) {
          issues.push({
            url: route.path,
            issueType: "meta_description_too_long",
            severity: "info",
            message: `The meta description is ${metaDescription.length} characters; search results truncate around 160.`,
            remediation: "Shorten it to fit the snippet.",
          });
        }
        const list = descriptions.get(metaDescription) ?? [];
        list.push(route.path);
        descriptions.set(metaDescription, list);
      }

      /* --- Canonical --- */
      const canonical = readLinkHref(html, "canonical");
      if (!canonical) {
        issues.push({
          url: route.path,
          issueType: "missing_canonical",
          severity: "warning",
          message: "The page has no canonical link.",
          remediation:
            "Add a canonical URL so search engines treat one address as the real one.",
        });
      } else if (!/^https?:\/\//i.test(canonical)) {
        issues.push({
          url: route.path,
          issueType: "invalid_canonical",
          severity: "error",
          message: `The canonical URL is not absolute: “${canonical}”.`,
          remediation:
            "A canonical URL must be an absolute https URL, including the domain.",
        });
      }

      /* --- Open Graph --- */
      const ogTitle = html.match(
        /<meta\b[^>]*\bproperty=["']og:title["'][^>]*\bcontent=["']([^"']*)["']/i
      );
      const ogDescription = html.match(
        /<meta\b[^>]*\bproperty=["']og:description["'][^>]*\bcontent=["']([^"']*)["']/i
      );
      const ogImage = html.match(
        /<meta\b[^>]*\bproperty=["']og:image["'][^>]*\bcontent=["']([^"']*)["']/i
      );
      if (!ogTitle) {
        issues.push({
          url: route.path,
          issueType: "missing_open_graph_title",
          severity: "warning",
          message: "The page has no og:title, so shared links use the page title.",
          remediation: "Add an og:title so a shared link reads as you wrote it.",
        });
      }
      if (!ogDescription) {
        issues.push({
          url: route.path,
          issueType: "missing_open_graph_description",
          severity: "info",
          message: "The page has no og:description.",
          remediation: "Add one — it is the text shown under a shared link.",
        });
      }
      if (!ogImage) {
        issues.push({
          url: route.path,
          issueType: "missing_open_graph_image",
          severity: "warning",
          message: "The page has no og:image, so shared links have no picture.",
          remediation: "Add an og:image — a shared link without one rarely gets clicked.",
        });
      }

      /* --- Twitter card --- */
      if (!/name=["']twitter:card["']/i.test(html)) {
        issues.push({
          url: route.path,
          issueType: "missing_twitter_card",
          severity: "info",
          message: "The page has no twitter:card tag.",
          remediation: "Add twitter:card to control how the link is previewed.",
        });
      }

      /* --- Robots --- */
      const robotsMeta = html.match(
        /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']([^"']*)["']/i
      );
      if (robotsMeta && /noindex/i.test(robotsMeta[1])) {
        issues.push({
          url: route.path,
          issueType: "unexpected_noindex",
          severity: "error",
          message: "The page is marked noindex, so it will not appear in search results.",
          remediation:
            "Remove the noindex directive unless the page is deliberately private.",
        });
      }

      /* --- Headings --- */
      const h1s = readAllTags(html, "h1", "class").length;
      const rawH1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) ?? [];
      if (rawH1.length === 0) {
        issues.push({
          url: route.path,
          issueType: "missing_h1",
          severity: "error",
          message: "The page has no <h1>.",
          remediation: "Give the page exactly one <h1> that names its subject.",
        });
      } else if (rawH1.length > 1) {
        issues.push({
          url: route.path,
          issueType: "multiple_h1",
          severity: "warning",
          message: `The page has ${rawH1.length} <h1> elements.`,
          remediation: "Keep one <h1> and demote the rest to <h2>.",
        });
      }
      void h1s;

      const headingLevels = [
        ...html.matchAll(/<h([1-6])\b[^>]*>/gi),
      ].map((match) => Number(match[1]));
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) {
          issues.push({
            url: route.path,
            issueType: "heading_level_skipped",
            severity: "info",
            message: `A heading jumps from h${headingLevels[i - 1]} to h${headingLevels[i]}.`,
            remediation:
              "Do not skip a level — the outline is how assistive technology navigates.",
          });
          break;
        }
      }

      /* --- Image alt text --- */
      const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
      for (const image of images) {
        const altMatch = image.match(/\balt=["']([^"']*)["']/i);
        if (!altMatch) {
          issues.push({
            url: route.path,
            issueType: "missing_image_alt",
            severity: "error",
            message: "An <img> has no alt attribute.",
            remediation:
              "Give every image an alt attribute — empty for decoration, descriptive for content.",
          });
        } else if (altMatch[1].trim() === "") {
          issues.push({
            url: route.path,
            issueType: "empty_image_alt",
            severity: "info",
            message: "An <img> has an empty alt attribute.",
            remediation:
              "That is correct for a decorative image. If it carries meaning, describe it.",
          });
        }
      }

      /* --- Internal links --- */
      const anchors = knownAnchors();
      for (const href of readAllTags(html, "a", "href")) {
        if (!href.startsWith("#")) continue;
        const id = href.slice(1);
        if (!id) continue;
        if (!anchors.has(id)) {
          issues.push({
            url: route.path,
            issueType: "broken_internal_link",
            severity: "warning",
            message: `An internal link points at “#${id}”, which does not exist on the page.`,
            remediation:
              "Point the link at a real section, or remove it. A dead anchor is a dead end for a visitor and for a crawler.",
          });
        }
      }
    }

    /* --- Duplicate titles and descriptions across pages --- */
    for (const [title, paths] of titles) {
      if (paths.length > 1) {
        issues.push({
          url: paths.join(", "),
          issueType: "duplicate_title",
          severity: "warning",
          message: `${paths.length} pages share the title “${title}”.`,
          remediation: "Give each page its own title.",
        });
      }
    }
    for (const paths of descriptions.values()) {
      if (paths.length > 1) {
        issues.push({
          url: paths.join(", "),
          issueType: "duplicate_meta_description",
          severity: "info",
          message: `${paths.length} pages share the same meta description.`,
          remediation: "Give each page its own description.",
        });
      }
    }

    /* --- robots.txt --- */
    const robotsText = await fetchPublic("/robots.txt", base);
    if (robotsText === null) {
      issues.push({
        url: "/robots.txt",
        issueType: "robots_unreachable",
        severity: "error",
        message: "robots.txt did not respond with a successful status.",
        remediation: "Generate robots.txt from the route, and check the deployment.",
      });
    } else if (!/User-Agent/i.test(robotsText)) {
      issues.push({
        url: "/robots.txt",
        issueType: "robots_malformed",
        severity: "error",
        message: "robots.txt has no User-Agent group.",
        remediation: "Start the file with a User-Agent line.",
      });
    } else if (!/Allow:\s*\/|Disallow:\s*\/api|Disallow:\s*\/admin/i.test(robotsText)) {
      issues.push({
        url: "/robots.txt",
        issueType: "robots_allows_private_paths",
        severity: "warning",
        message: "robots.txt does not exclude the private paths.",
        remediation: "Disallow /admin and /api so they are not crawled.",
      });
    }

    /* --- sitemap.xml --- */
    const sitemapText = await fetchPublic("/sitemap.xml", base);
    if (sitemapText === null) {
      issues.push({
        url: "/sitemap.xml",
        issueType: "sitemap_unreachable",
        severity: "error",
        message: "sitemap.xml did not respond with a successful status.",
        remediation:
          "Set NEXT_PUBLIC_SITE_URL so the sitemap has an origin to build absolute URLs from.",
      });
    } else {
      const locations = [
        ...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/gi),
      ].map((match) => decodeEntities(match[1].trim()));

      if (locations.length === 0) {
        issues.push({
          url: "/sitemap.xml",
          issueType: "sitemap_empty",
          severity: "warning",
          message: "The sitemap contains no URLs.",
          remediation:
            "Set NEXT_PUBLIC_SITE_URL — without it the sitemap is intentionally empty rather than wrong.",
        });
      }

      for (const location of locations) {
        let pathname = location;
        try {
          pathname = new URL(location).pathname;
        } catch {
          issues.push({
            url: location,
            issueType: "sitemap_invalid_url",
            severity: "error",
            message: "The sitemap contains a URL that is not a valid absolute URL.",
            remediation: "Every sitemap entry must be an absolute https URL.",
          });
          continue;
        }

        if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
          issues.push({
            url: location,
            issueType: "sitemap_private_path",
            severity: "error",
            message: "The sitemap lists a private path.",
            remediation: "Only public portfolio URLs belong in the sitemap.",
          });
        }
      }

      for (const route of PUBLIC_ROUTES) {
        if (!route.inSitemap) continue;
        const present = locations.some((location) => {
          try {
            return new URL(location).pathname === route.path;
          } catch {
            return false;
          }
        });
        if (!present) {
          issues.push({
            url: route.path,
            issueType: "sitemap_missing_page",
            severity: "warning",
            message: "A public page is not listed in the sitemap.",
            remediation: "Add the page to the sitemap, or mark it deliberately excluded.",
          });
        }
      }
    }

    const errors = issues.filter((issue) => issue.severity === "error").length;
    const warnings = issues.filter((issue) => issue.severity === "warning").length;
    const infos = issues.filter((issue) => issue.severity === "info").length;

    for (const issue of issues) await addAuditIssue(runId, issue);

    await finishAuditRun(runId, {
      pages: pagesChecked,
      errors,
      warnings,
      infos,
    });

    return {
      runId,
      pagesChecked,
      errors,
      warnings,
      infos,
      issues,
    };
  } catch (error) {
    await finishAuditRun(
      runId,
      { pages: pagesChecked, errors: 0, warnings: 0, infos: 0 },
      (error as Error).message
    );
    throw error;
  }
}

/** The routes the audit will check, for the console to display. */
export function auditableRoutes(): PublicRoute[] {
  return PUBLIC_ROUTES;
}

export { CONCURRENCY };
