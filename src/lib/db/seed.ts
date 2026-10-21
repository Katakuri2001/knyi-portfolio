import caseStudiesSeed from "../../../content/case-studies.json";
import educationSeed from "../../../content/education.json";
import profileSeed from "../../../content/profile.json";
import servicesSeed from "../../../content/services.json";
import toolsSeed from "../../../content/tools.json";

/**
 * The seed content.
 *
 * The files in `content/` are the reviewed starting point. They are bundled
 * with the code, so a fresh deployment — a new D1 database, a fresh checkout —
 * renders the right thing before anything has been written to the store.
 *
 * They live here rather than in `content.ts` so the adapter can seed the store
 * on first connect without importing the content layer, which imports the
 * adapter.
 */

export type ContentKind =
  | "profile"
  | "services"
  | "tools"
  | "education"
  | "case-studies";

export const CONTENT_KINDS: ContentKind[] = [
  "profile",
  "services",
  "tools",
  "education",
  "case-studies",
];

export const SEEDS: Record<ContentKind, unknown> = {
  profile: profileSeed,
  services: servicesSeed,
  tools: toolsSeed,
  education: educationSeed,
  "case-studies": caseStudiesSeed,
};
