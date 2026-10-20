/**
 * In-memory rate limiting.
 *
 * A sliding window per key, held in process memory. This is appropriate for a
 * single-instance deployment and is the right trade for a personal portfolio:
 * the alternative (a database table) adds a write to every rejected request,
 * which is exactly the path an attacker wants to be expensive.
 *
 * The limit is deliberately generous for humans and tight for scripts: a
 * person can fill in a contact form several times; a script cannot do it a
 * hundred times.
 *
 * Note: with more than one application instance the window is per instance.
 * A shared store (Redis, or a table) would be required to make the limit
 * global — noted here rather than pretended away.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

/** Keeps the map from growing without bound. */
const MAX_BUCKETS = 10_000;

function prune(nowMs: number, windowMs: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((at) => nowMs - at < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;

  prune(nowMs, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((at) => nowMs - at < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfter = Math.max(
      1,
      Math.ceil((oldest + windowMs - nowMs) / 1000)
    );
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
  }

  bucket.hits.push(nowMs);
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: limit - bucket.hits.length,
    retryAfterSeconds: 0,
  };
}

/** Clears every bucket. Used by tests. */
export function resetRateLimits() {
  buckets.clear();
}
