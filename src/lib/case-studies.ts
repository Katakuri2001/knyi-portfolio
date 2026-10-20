import type { CaseStudy } from "@/lib/content";

/**
 * Case-study validation.
 *
 * The dashboard posts arbitrary JSON, so every field is whitelisted and
 * coerced here rather than trusted. Unknown keys are dropped, strings are
 * trimmed and capped, and optional figures are stored as `null` when blank so
 * the public page renders no row for them — the page never invents a metric.
 */

const MAX_STRING = 400;
const MAX_NOTE = 1200;

/** Only these image paths are accepted; anything else is discarded. */
const IMAGE_PATTERN = /^\/api\/uploads\/[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/i;

export class ValidationError extends Error {}

function str(value: unknown, max = MAX_STRING): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function positiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

export type CaseStudyInput = Record<string, unknown>;

/**
 * Turns untrusted input into a complete case study. `existing` is the current
 * record when editing, so omitting a field keeps its value rather than
 * silently blanking it.
 */
export function sanitiseCaseStudy(
  input: CaseStudyInput,
  existing?: CaseStudy
): CaseStudy {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Expected an object");
  }

  const title = str(input.title, 160);
  if (!title) throw new ValidationError("Title is required.");

  const category = str(input.category, 160) ?? title;

  const platform =
    str(input.platform, 120) ??
    existing?.platform ??
    "Meta advertising";

  const image = str(input.image, 300);
  if (image && !IMAGE_PATTERN.test(image)) {
    throw new ValidationError("Image must be an uploaded file.");
  }

  const scope = str(input.scope) ?? existing?.scope ?? null;
  const methodologyNote =
    str(input.methodologyNote, MAX_NOTE) ??
    existing?.methodologyNote ??
    null;

  return {
    id: existing?.id ?? "",
    title,
    category,
    platform,
    adSpend: str(input.adSpend) ?? null,
    duration: str(input.duration) ?? null,
    audienceGrowth: str(input.audienceGrowth) ?? null,
    orders: str(input.orders) ?? null,
    averageOrdersPerMonth: str(input.averageOrdersPerMonth) ?? null,
    averageOrderValue: str(input.averageOrderValue) ?? null,
    scope,
    reported: bool(input.reported, existing?.reported ?? true),
    verified: bool(input.verified, existing?.verified ?? false),
    methodologyNote,
    image: image ?? null,
    imageAlt: str(input.imageAlt, 200) ?? existing?.imageAlt ?? null,
    imageWidth: positiveInt(input.imageWidth),
    imageHeight: positiveInt(input.imageHeight),
    order: positiveInt(input.order),
  };
}

/** Ids are generated server-side, never taken from the client. */
export function createId(): string {
  return `cs_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Keeps the file's display order contiguous after a create, delete or move. */
export function normaliseOrder(studies: CaseStudy[]): CaseStudy[] {
  return studies.map((study, index) => ({ ...study, order: index }));
}