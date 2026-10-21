import "server-only";

import { getDb, now } from "./db/index.ts";
import type {
  CaseStudy,
  Education,
  Profile,
  Services,
  Tools,
} from "./db/content-types.ts";

export type {
  CaseStudy,
  Education,
  Profile,
  Services,
  Tools,
} from "./db/content-types.ts";

/**
 * The content layer.
 *
 * ## Where the content lives
 *
 * The reviewed portfolio copy — profile, services, tools, education, case studies
 * — is stored in the database, in a `content_documents` table that holds one
 * JSON document per kind. The files in `content/` are the **seed**: they are
 * bundled with the code and used when the database has no row for a kind, so a
 * fresh deployment renders correctly before anything is seeded.
 *
 * Storing it in the database rather than on disk is what lets the console work
 * on a platform with no writable filesystem — Cloudflare Workers, for one. The
 * seed files stay in git as the reviewed starting point.
 */

import { CONTENT_KINDS, SEEDS, type ContentKind } from "./db/seed.ts";

export { CONTENT_KINDS };
export type { ContentKind };

/** Reads a content document, falling back to the bundled seed. */
export async function readContent<T>(kind: ContentKind): Promise<T> {
  const db = await getDb();
  const row = await db.first<{ data: string }>(
    "SELECT data FROM content_documents WHERE kind = ?",
    [kind]
  );

  if (row?.data) {
    try {
      return JSON.parse(row.data) as T;
    } catch {
      // A corrupt document must not take the page down; the seed is safe.
    }
  }

  return SEEDS[kind] as T;
}

/** Writes a content document. */
export async function writeContent(
  kind: ContentKind,
  value: unknown
): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO content_documents (kind, data, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT (kind) DO UPDATE SET
       data = excluded.data,
       updated_at = excluded.updated_at`,
    [kind, JSON.stringify(value, null, 2), now()]
  );
}

/** Every content document, for a backup export. */
export async function exportContent(): Promise<
  Record<ContentKind, unknown>
> {
  const out = {} as Record<ContentKind, unknown>;
  for (const kind of CONTENT_KINDS) {
    out[kind] = await readContent(kind);
  }
  return out;
}

/** Seeds the store from the bundled files. Existing documents are left alone. */
export async function seedContent(): Promise<number> {
  const db = await getDb();
  let seeded = 0;
  for (const kind of CONTENT_KINDS) {
    const existing = await db.first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM content_documents WHERE kind = ?",
      [kind]
    );
    if (existing && existing.n > 0) continue;
    await writeContent(kind, SEEDS[kind]);
    seeded++;
  }
  return seeded;
}

/* ---------------------------------------------------------------------------
   Typed readers
   --------------------------------------------------------------------------- */

export async function getCaseStudies(): Promise<CaseStudy[]> {
  const data = await readContent<CaseStudy[]>("case-studies");
  return Array.isArray(data) ? data : [];
}

export async function getProfile(): Promise<Profile> {
  return readContent<Profile>("profile");
}

export async function getServices(): Promise<Services> {
  return readContent<Services>("services");
}

export async function getTools(): Promise<Tools> {
  return readContent<Tools>("tools");
}

export async function getEducation(): Promise<Education> {
  return readContent<Education>("education");
}

/* ---------------------------------------------------------------------------
   Expertise groups

   Presentation metadata only. Each group points at the discipline in
   services.json that supplies its description, so the prose is never
   duplicated. The capability names are the focus areas already documented in
   PROJECT-SUMMARY.md, regrouped for scanning — no capability is added.
   --------------------------------------------------------------------------- */

export type ExpertiseGroup = {
  index: string;
  title: string;
  source: keyof Services;
  capabilities: string[];
};

export const EXPERTISE_GROUPS: ExpertiseGroup[] = [
  {
    index: "01",
    title: "Strategy & Research",
    source: "marketingAnalysis",
    capabilities: [
      "Business & marketing objectives",
      "Audience research",
      "Competitor research",
      "Offer analysis",
      "Customer journey thinking",
      "Funnel strategy",
      "Problem identification",
    ],
  },
  {
    index: "02",
    title: "Campaign Planning & Media Buying",
    source: "metaAds",
    capabilities: [
      "Campaign objectives & KPI planning",
      "Audience strategy & segmentation",
      "Media planning & channel selection",
      "Budget allocation",
      "Retargeting concepts",
      "Creative testing direction",
    ],
  },
  {
    index: "03",
    title: "Creative & Content",
    source: "contentStrategy",
    capabilities: [
      "Content pillars & angles",
      "Content calendars & planning",
      "Copywriting & messaging",
      "Audience-focused positioning",
      "Funnel planning & advertising alignment",
    ],
  },
  {
    index: "04",
    title: "Performance Analysis & Optimization",
    source: "metaAds",
    capabilities: [
      "Performance monitoring",
      "CPM, CTR, CPC, CPA & ROAS analysis",
      "Measurement framework",
      "Opportunity identification",
      "Data-driven iteration",
      "Continuous improvement",
    ],
  },
];

/* ---------------------------------------------------------------------------
   Case studies — derived views
   --------------------------------------------------------------------------- */

export type CaseMetric = { label: string; value: string };

/** Metrics in the order they read best. A field the record does not supply
 *  produces no row at all — nothing is filled in or defaulted. */
export function caseMetrics(study: CaseStudy): CaseMetric[] {
  const metrics: CaseMetric[] = [];

  if (study.adSpend) metrics.push({ label: "Ad spend", value: study.adSpend });
  if (study.duration) metrics.push({ label: "Duration", value: study.duration });
  if (study.audienceGrowth)
    metrics.push({ label: "Audience growth", value: study.audienceGrowth });
  if (study.orders) metrics.push({ label: "Orders", value: study.orders });
  if (study.averageOrdersPerMonth)
    metrics.push({
      label: "Avg orders / month",
      value: study.averageOrdersPerMonth,
    });
  if (study.averageOrderValue)
    metrics.push({ label: "Avg order value", value: study.averageOrderValue });

  return metrics;
}

/** Display title. In the seed data `title` repeats `category`, so prefer
 *  whichever is more specific. */
export function caseTitle(study: CaseStudy): string {
  if (!study.title) return study.category;
  if (!study.category) return study.title;
  return study.title === study.category ? study.category : study.title;
}
