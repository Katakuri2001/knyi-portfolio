#!/usr/bin/env node
/**
 * Static export for GitHub Pages.
 *
 * GitHub Pages serves files. It cannot run a server, so the API routes and
 * the admin console — which both need one — cannot be part of the export.
 * They are moved out of the app directory for the duration of the build and
 * put straight back afterwards, including when the build fails.
 *
 * On CI the checkout is disposable, so this is invisible. Locally the tree is
 * always restored, and a stash left behind by an interrupted run is recovered
 * on the next invocation rather than silently lost.
 *
 * The public site is unaffected: the export contains the same page, the same
 * content and the same images.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "src", "app");
const stashDir = path.join(root, ".pages-stash");

/** Directories that need a server and therefore cannot be exported. */
const SERVER_ONLY = ["api", "admin"];

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`))
    );
  });
}

async function restore() {
  if (!existsSync(stashDir)) return;
  for (const name of SERVER_ONLY) {
    const stashed = path.join(stashDir, name);
    if (existsSync(stashed)) {
      await rm(path.join(appDir, name), { recursive: true, force: true });
      await rename(stashed, path.join(appDir, name));
    }
  }
  await rm(stashDir, { recursive: true, force: true });
}

async function main() {
  // Recover from a previous interrupted run first.
  await restore();

  await mkdir(stashDir, { recursive: true });
  for (const name of SERVER_ONLY) {
    const source = path.join(appDir, name);
    if (existsSync(source)) {
      await rename(source, path.join(stashDir, name));
    }
  }

  try {
    await run("npx", ["next", "build"], {
      env: { ...process.env, NEXT_TARGET: "pages" },
    });
    console.log("\nStatic export written to ./out");
  } finally {
    await restore();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
