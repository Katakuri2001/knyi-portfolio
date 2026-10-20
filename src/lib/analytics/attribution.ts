/**
 * Acquisition, campaign and attribution logic.
 *
 * Isomorphic — it runs in the browser (to classify the current visit) and on
 * the server (to classify a stored event). No Node-only imports.
 *
 * ## Attribution model
 *
 * Two models are recorded side by side, and the console always says which one
 * it is showing:
 *
 * - **First touch** — the channel that first brought the visitor. Kept on the
 *   visitor row. This is the right question for "which channel introduced
 *   people to me".
 * - **Last non-direct** — the most recent channel that was not `(direct)`.
 *   Kept on the visitor row. This is the right question for "which channel
 *   is working right now".
 *
 * Direct is never allowed to overwrite a real source: a visitor who arrived
 * from Google and then typed the URL is still a Google visitor for
 * attribution purposes. That rule is applied in `mergeAttribution` below.
 */

export const CHANNELS = [
  "organic_search",
  "paid_search",
  "paid_social",
  "organic_social",
  "email",
  "referral",
  "direct",
  "other",
] as const;

export type Channel = (typeof CHANNELS)[number];

const SEARCH_ENGINES = [
  "google.",
  "bing.",
  "duckduckgo.",
  "yahoo.",
  "yandex.",
  "baidu.",
  "ecosia.",
  "brave.",
  "startpage.",
  "search.marcia",
];

const SOCIAL_HOSTS = [
  "facebook.",
  "instagram.",
  "linkedin.",
  "twitter.",
  "x.com",
  "tiktok.",
  "youtube.",
  "reddit.",
  "pinterest.",
  "threads.",
  "t.me",
  "telegram.",
  "wa.me",
  "whatsapp.",
];

/** Well-known paid search referrers. */
const PAID_SEARCH_HOSTS = ["googleadservices.", "doubleclick.", "bingads.", "ads."];

/** Normalised UTM parameters. */
export type UtmSet = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
};

export const EMPTY_UTM: UtmSet = {
  source: null,
  medium: null,
  campaign: null,
  content: null,
  term: null,
};

const MAX_UTM_LENGTH = 100;

/**
 * Reads and normalises the UTM parameters from a query string.
 *
 * Values are trimmed, lower-cased, length-capped, and stripped of anything
 * that is not a letter, a digit, a dash, an underscore or a dot. A parameter
 * that is not present is `null` — never an empty string, and never a guess.
 */
export function readUtm(search: string): UtmSet {
  const params = new URLSearchParams(search);
  const pick = (key: string): string | null => {
    const raw = params.get(key);
    if (!raw) return null;
    const cleaned = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_UTM_LENGTH);
    return cleaned.length > 0 ? cleaned : null;
  };

  return {
    source: pick("utm_source"),
    medium: pick("utm_medium"),
    campaign: pick("utm_campaign"),
    content: pick("utm_content"),
    term: pick("utm_term"),
  };
}

export function utmIsEmpty(utm: UtmSet): boolean {
  return !utm.source && !utm.medium && !utm.campaign;
}

/**
 * Classifies the acquisition channel.
 *
 * The order matters: a UTM source is the owner's own label and wins over an
 * inferred referrer. Then paid search, then organic search, then social, then
 * referral.
 */
export function classifyChannel(
  utm: UtmSet,
  referrerHost: string | null
): Channel {
  const source = utm.source ?? "";
  const medium = utm.medium ?? "";

  if (source) {
    if (medium === "cpc" || medium === "ppc" || medium === "paid") {
      return source.includes("search") || source.includes("sem") ? "paid_search" : "paid_social";
    }
    if (medium === "email" || medium === "newsletter") return "email";
    if (medium === "social" || medium === "social-media" || medium === "paid_social") {
      return medium === "paid_social" ? "paid_social" : "organic_social";
    }
    if (medium === "organic" || medium === "seo") return "organic_search";
    if (medium === "referral") return "referral";
    if (medium === "affiliate") return "referral";
  }

  if (!referrerHost) return "direct";

  const host = referrerHost.toLowerCase();

  if (PAID_SEARCH_HOSTS.some((needle) => host.includes(needle))) return "paid_search";
  if (SEARCH_ENGINES.some((needle) => host.includes(needle))) return "organic_search";
  if (SOCIAL_HOSTS.some((needle) => host.includes(needle))) return "organic_social";

  return "referral";
}

/** Hostname only — never a full URL, never a path, never a query string. */
export function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (!url.hostname) return null;
    return url.hostname.toLowerCase().replace(/^www\./, "").slice(0, 120);
  } catch {
    return null;
  }
}

/** A coarse device category, from the client-reported hints. */
export function classifyDevice(
  width: number | undefined,
  userAgentIsMobile: boolean | undefined
): "mobile" | "tablet" | "desktop" {
  if (userAgentIsMobile) return "mobile";
  if (!width) return "desktop";
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/** A coarse browser family. Deliberately not a UA string. */
export function classifyBrowser(userAgent: string | undefined): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "opera";
  if (ua.includes("firefox")) return "firefox";
  if (ua.includes("chrome")) return "chrome";
  if (ua.includes("safari")) return "safari";
  return "other";
}

export type Attribution = {
  channel: Channel;
  referrerHost: string | null;
  utm: UtmSet;
};

/**
 * Merges a new visit's attribution into the visitor's stored attribution.
 *
 * Two rules, and they are the whole model:
 *
 * 1. **First touch is never overwritten.** The first channel that brought the
 *    visitor in is the one that counts as "where they came from".
 * 2. **Direct never overwrites a real source.** A visitor who arrived from
 *    Google and later typed the URL keeps Google as their last non-direct
 *    source.
 */
export function mergeAttribution(
  previous: {
    channel: Channel;
    referrerHost: string | null;
    utm: UtmSet;
  } | null,
  incoming: Attribution
): {
  first: { channel: Channel; referrerHost: string | null; utm: UtmSet };
  last: { channel: Channel; referrerHost: string | null; utm: UtmSet };
} {
  if (!previous) {
    return { first: incoming, last: incoming };
  }

  const first = {
    channel: previous.channel,
    referrerHost: previous.referrerHost,
    utm: previous.utm,
  };

  let last = {
    channel: previous.channel,
    referrerHost: previous.referrerHost,
    utm: previous.utm,
  };

  const incomingIsDirect = incoming.channel === "direct";
  const previousIsDirect = previous.channel === "direct";

  if (!incomingIsDirect) {
    // A real source always updates the last non-direct attribution.
    last = incoming;
  } else if (previousIsDirect) {
    // Still nothing but direct — keep it.
    last = incoming;
  }
  // else: incoming is direct and the previous was not → keep the previous.

  return { first, last };
}
