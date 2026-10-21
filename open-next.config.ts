import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import R2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import D1NextModeTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * The OpenNext configuration.
 *
 * The public portfolio is served from the assets layer — prerendered HTML that
 * never reaches the Worker, so it costs no CPU. The console and the API are
 * dynamic and run in the Worker.
 *
 * The incremental cache is R2 and the tag cache is D1, which is what makes
 * `revalidatePath("/")` in the console actually regenerate the public page: it
 * purges the cache entry, and the next request re-renders from D1.
 *
 * The binding names are fixed by the adapter:
 * `NEXT_INC_CACHE_R2_BUCKET` for the cache bucket and `NEXT_TAG_CACHE_D1` for
 * the tag database. They are declared in wrangler.jsonc.
 */
export default defineCloudflareConfig({
  incrementalCache: R2IncrementalCache,
  tagCache: D1NextModeTagCache,
});
