#!/usr/bin/env node
/**
 * Deploy the static export to GitHub Pages via the `gh-pages` branch.
 *
 * ## Why a branch and not the Actions workflow
 *
 * There are two ways to publish a static site to GitHub Pages:
 *
 * 1. **GitHub Actions** (`.github/workflows/deploy-pages.yml`) — the build runs
 *    on GitHub's runners and publishes automatically on every push. This is the
 *    better setup, and the workflow is in the repo, ready to use.
 * 2. **A `gh-pages` branch** — the built site is committed to a branch and
 *    GitHub Pages serves that branch directly. The build runs on your machine.
 *
 * The branch route exists because the account is currently **billing-locked**,
 * and a locked account cannot start an Actions runner at all — every workflow
 * fails with "The job was not started because your account is locked due to a
 * billing issue", before a single step executes. The branch route needs no
 * runner, so the site can go live regardless.
 *
 * Once the billing issue is resolved, switch Pages back to "GitHub Actions" in
 * the repository settings and the workflow takes over. Nothing else changes.
 *
 * ## Usage
 *
 *     npm run deploy:pages
 *
 * ## Safety
 *
 * The commit is built with a **temporary index file**, so the working tree and
 * the real index are never touched. A failed run cannot leave the repository
 * on a stray branch with unstaged files — the failure mode that an
 * `orphan` branch approach invites.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");
const branch = "gh-pages";

const BASE_PATH = "/knyi-portfolio";
const ORIGIN = `https://katakuri2001.github.io${BASE_PATH}`;

function run(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  return execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    ...options,
  });
}

function capture(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf-8",
    ...options,
  }).trim();
}

async function main() {
  // 1. Build the export with the repository sub-path baked in.
  run("npm", ["run", "build:pages"], {
    env: {
      ...process.env,
      NEXT_TARGET: "pages",
      NEXT_PUBLIC_BASE_PATH: BASE_PATH,
      NEXT_PUBLIC_SITE_URL: ORIGIN,
    },
  });

  if (!existsSync(outDir)) {
    throw new Error("The export directory `out/` was not produced.");
  }

  // 2. Build a commit containing only the export, using a temporary index and
  //    a temporary work tree so the real working tree and index are never
  //    touched. The export's *contents* become the branch root — GitHub Pages
  //    serves the branch root, so `out/index.html` would not be found.
  const staging = path.join(os.tmpdir(), `knyi-pages-stage-${Date.now()}`);
  // The index lives outside the staging directory — otherwise `git add` picks
  // the index file itself up and it lands in the published branch.
  const indexFile = path.join(os.tmpdir(), `knyi-pages-index-${Date.now()}`);
  await cp(outDir, staging, { recursive: true });

  const withIndex = {
    env: {
      ...process.env,
      GIT_DIR: path.join(root, ".git"),
      GIT_INDEX_FILE: indexFile,
      GIT_WORK_TREE: staging,
    },
    cwd: staging,
  };

  try {
    run("git", ["read-tree", "--empty"], withIndex);
    // `out/` is gitignored, so it has to be force-added into the temporary
    // index. Nothing is written to the real index.
    run("git", ["add", "-A", "-f", "."], withIndex);

    const tree = capture("git", ["write-tree"], withIndex);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    // Where the export came from. The script publishes whatever is in the
    // working tree, so the published history says which branch and which
    // commit produced it — otherwise a deploy from a working branch and a
    // deploy from `main` are indistinguishable after the fact.
    const source = capture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
    const sourceCommit = capture("git", ["rev-parse", "--short", "HEAD"]);
    const message = `Deploy ${stamp}\n\nStatic export of the public site, published to the gh-pages branch.\n\nSource: ${source}@${sourceCommit}`;

    const commit = capture("git", ["commit-tree", tree, "-m", message]);

    run("git", ["push", "--force", "origin", `${commit}:refs/heads/${branch}`]);
  } finally {
    await rm(staging, { recursive: true, force: true });
    await rm(indexFile, { force: true });
    await rm(`${indexFile}.lock`, { force: true });
  }

  console.log(`\nPublished to ${ORIGIN}/`);
  console.log(`  Served from the '${branch}' branch.`);
  console.log(`  Built from ${source}@${sourceCommit}.`);
  console.log(`  GitHub can take a minute or two to publish a new commit.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
