#!/usr/bin/env node
/**
 * Builds the OpenNext Worker bundle, with the wrangler `vars` in the build
 * environment.
 *
 * ## Why this exists
 *
 * `wrangler.jsonc` is the single source of truth for the Worker's
 * configuration. But `NEXT_PUBLIC_*` variables are **inlined at build time**,
 * not read at runtime, and the OpenNext build does not put the wrangler
 * `vars` into the `next build` environment — it only ships them to the Worker
 * at runtime.
 *
 * The public site URL is one of those. It decides the canonical URL, the
 * sitemap, `og:url` and the robots file, and the public page is **prerendered
 * during the build**. Without it in the build environment, the prerendered
 * page would carry no canonical URL, and the sitemap would be empty.
 *
 * So the build reads the wrangler config and passes its `vars` through. One
 * source of truth, and the build and the runtime see the same values.
 *
 * Secrets are **not** handled here. They are set on the Worker with
 * `wrangler secret put` and are read from the environment at runtime.
 */
import { spawn } from "node:child_process";
import { unstable_readConfig } from "wrangler";

const config = await unstable_readConfig({ config: "wrangler.jsonc" });
const vars = config.vars ?? {};

if (Object.keys(vars).length === 0) {
  console.warn("No `vars` in wrangler.jsonc — the build will see none either.");
} else {
  console.log("Build environment from wrangler.jsonc:");
  for (const [key, value] of Object.entries(vars)) {
    console.log(`  ${key}=${value}`);
  }
}

const child = spawn(
  "npx",
  ["opennextjs-cloudflare", "build", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      // Selects the Cloudflare build in next.config.ts.
      NEXT_TARGET: "cloudflare",
      ...vars,
    },
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
