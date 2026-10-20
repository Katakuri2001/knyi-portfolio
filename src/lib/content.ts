/**
 * Content layer — the single source of truth for every section.
 *
 * ## Why this exists
 *
 * Each section used to hardcode a second copy of the strings in `content/`.
 * That is how `case-studies.json`'s `averageOrderValue: "US$3"` for the paratha
 * business drifted out of the rendered page. Every section now reads from here.
 *
 * ## Why it reads from disk at request time
 *
 * A static `import caseStudies from "...json"` is baked into the server bundle
 * at build time, so the /admin dashboard could write a new case study and the
 * public page would never show it. Reading with `fs` inside the render function
 * means:
 *
 *   - at build time the page is still statically prerendered (no fs = no
 *     dynamic IO, so Next keeps it as a static route), and
 *   - when /admin calls `revalidatePath("/")`, the re-render calls `fs` again
 *     and picks up the new file.
 *
 * Everything that reads this module is a server component or a route handler.
 */

import fs from "node:fs";
import path from "node:path";

/* ---------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------- */

export type Profile = {
  name: string;
  professionalName: string;
  tagline: string;
  positioning: string;
  background: string;
  howITick: string;
  whatIVALUE: string;
  location: string;
  remoteAvailability: string;
  contact: {
    email: string;
    telegram: string;
    phone: string;
    website: string;
  };
};

/** Mirrors `content/case-studies.json`. New fields are optional by design —
 *  a metric the owner has not supplied is simply absent, never invented. */
export type CaseStudy = {
  id: string;
  title: string;
  category: string;
  platform: string;
  adSpend?: string | null;
  duration?: string | null;
  audienceGrowth?: string | null;
  orders?: string | null;
  averageOrdersPerMonth?: string | null;
  averageOrderValue?: string | null;
  scope?: string | null;
  reported?: boolean;
  verified?: boolean;
  methodologyNote?: string | null;
  /** Public path of an uploaded image, e.g. "/api/uploads/abc.jpg". */
  image?: string | null;
  /** Description of the uploaded image, used as its alt text. */
  imageAlt?: string | null;
  /** Stored so the frame can reserve space before the image loads (no CLS). */
  imageWidth?: number | null;
  imageHeight?: number | null;
  /** Display order. Items without one fall back to their position in the file. */
  order?: number | null;
};

export type Services = {
  metaAds: { title: string; description: string; experience: string; learning: string };
  contentStrategy: { title: string; description: string; experience: string; learning: string };
  marketingAnalysis: { title: string; description: string; experience: string; learning: string };
};

export type Tools = {
  practicalExposure: string[];
  currentlyLearning: string[];
};

export type Education = {
  completed: { name: string; institution: string; year: number }[];
  currentlyStudying: { name: string; institution: string }[];
  university: { status: string };
};

/* ---------------------------------------------------------------------------
   Readers
   --------------------------------------------------------------------------- */

export const CONTENT_DIR = path.join(process.cwd(), "content");

/** Accepts "case-studies" or "case-studies.json". */
export function readJson<T>(name: string): T {
  const file = name.endsWith(".json") ? name : `${name}.json`;
  return JSON.parse(
    fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8")
  ) as T;
}

export function writeJson(name: string, value: unknown) {
  const file = name.endsWith(".json") ? name : `${name}.json`;
  fs.writeFileSync(
    path.join(CONTENT_DIR, file),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf-8"
  );
}

/** Ordered, as displayed on the public page. */
export function getCaseStudies(): CaseStudy[] {
  return readJson<CaseStudy[]>("case-studies.json")
    .map((study, index) => ({ study, index }))
    .sort(
      (a, b) =>
        (a.study.order ?? a.index) - (b.study.order ?? b.index) ||
        a.index - b.index
    )
    .map((entry) => entry.study);
}

export function getProfile(): Profile {
  return readJson<Profile>("profile.json");
}

export function getServices(): Services {
  return readJson<Services>("services.json");
}

export function getTools(): Tools {
  return readJson<Tools>("tools.json");
}

export function getEducation(): Education {
  return readJson<Education>("education.json");
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