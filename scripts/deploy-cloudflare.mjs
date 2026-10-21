#!/usr/bin/env node
/**
 * Builds the Worker and publishes it.
 *
 * ## Why this is not `opennextjs-cloudflare deploy`
 *
 * That command does three things: build, **populate the R2 incremental
 * cache**, then `wrangler deploy`. The population step starts a temporary
 * local Worker and asks it to write the prerendered pages into the R2 cache
 * bucket. In this wrangler version the R2 binding is not wired into that
 * temporary Worker, so every write comes back as
 *
 *     R2 binding "R2" is not configured
 *
 * and the deploy aborts before the Worker is published.
 *
 * The population is an **optimisation**: it pre-loads the cache so the first
 * request is fast. The cache is written on demand at runtime by the
 * `r2-incremental-cache` override, and that binding *is* configured — it is
 * in `wrangler.jsonc`. So skipping the population loses nothing but the
 * head start, and the deploy goes through.
 *
 * If the pre-population is ever wanted, the adapter has a second path that
 * uploads to R2 over S3 instead, which needs an R2 API token:
 *
 *     npx opennextjs-cloudflare deploy --rclone
 *
 * with `RCLONE_CONFIG` pointing at a config carrying the bucket's
 * `access key id` and `secret access key`.
 *
 * `OPEN_NEXT_DEPLOY=true` is required: without it, `wrangler deploy` detects
 * an OpenNext project and calls the OpenNext deploy command, which would
 * call `wrangler deploy` again.
 */
import { spawn } from "node:child_process";

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} was killed by ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

// 1. The build, with the wrangler vars in the environment.
await run("node", ["scripts/build-cloudflare.mjs"]);

// 2. Publish.
console.log("\nPublishing the Worker...");
await run("npx", ["wrangler", "deploy"], { OPEN_NEXT_DEPLOY: "true" });
