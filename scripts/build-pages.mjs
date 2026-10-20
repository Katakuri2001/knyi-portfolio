#!/usr/bin/env node
/**
 * Builds the static export for GitHub Pages, in isolation.
 *
 * ## Why this is not just `next build` with a flag
 *
 * Next.js **ignores `distDir` when `output: "export"` is set** — the export
 * always builds in `.next` and writes to `out/`. That means running the export
 * overwrites the server build that `npm start` is running from, which is how
 * the console ended up serving a 404: the server was running the static export.
 *
 * So the export is built in its own directory, `.pages-build/`, with its own
 * `next.config.ts`. The two builds never share a directory and can never
 * clobber each other.
 *
 * ## What is copied
 *
 * `src/`, `public/`, `content/` and the config files are copied; `node_modules`
 * is symlinked rather than copied. `content/` is needed because the content
 * layer reads it during the render.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(root, ".pages-build");
const appDir = path.join(root, "src", "app");
const stashDir = path.join(root, ".pages-stash");

/** Directories that need a server and therefore cannot be exported. */
const SERVER_ONLY = ["api", "admin"];

function run(command, args, cwd = root) {
  console.log(`\n$ ${command} ${args.join(" ")}  (in ${path.relative(root, cwd) || "."})`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with ${code}`))
    );
  });
}

/**
 * The export's own config file.
 *
 * It is written rather than copied, because the server build's config must not
 * be modified to suit the export.
 */
function exportConfig(basePath) {
  const base = JSON.stringify(basePath);
  const prefix = JSON.stringify(basePath ? `${basePath}/` : "");

  return `import type { NextConfig } from "next";

const basePath = ${base};
const assetPrefix = ${prefix};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  ...(basePath ? { basePath, assetPrefix } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
`;
}

async function main() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // A previous run may have been interrupted.
  await rm(buildDir, { recursive: true, force: true });
  await rm(stashDir, { recursive: true, force: true });

  // The server routes cannot be exported. They are taken out of the copy
  // rather than out of the working tree, so the source is never disturbed.
  await cp(path.join(root, "src"), path.join(buildDir, "src"), {
    recursive: true,
    filter: (source) =>
      !SERVER_ONLY.some(
        (name) => source === path.join(appDir, name)
      ),
  });

  await cp(path.join(root, "public"), path.join(buildDir, "public"), {
    recursive: true,
  });
  await cp(path.join(root, "content"), path.join(buildDir, "content"), {
    recursive: true,
  });

  for (const file of [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "postcss.config.mjs",
    "tailwind.config.ts",
    "eslint.config.mjs",
    ".env",
    ".env.local",
  ]) {
    const source = path.join(root, file);
    if (existsSync(source)) {
      await cp(source, path.join(buildDir, file));
    }
  }

  await writeFile(path.join(buildDir, "next.config.ts"), exportConfig(basePath));

  // One node_modules for both builds.
  const nodeModules = path.join(buildDir, "node_modules");
  if (!existsSync(nodeModules)) {
    await symlink(path.join(root, "node_modules"), nodeModules, "dir");
  }

  try {
    await run("npx", ["next", "build"], buildDir);

    const exportDir = path.join(buildDir, "out");
    if (!existsSync(path.join(exportDir, "index.html"))) {
      throw new Error("The export directory was not produced.");
    }

    await rm(path.join(root, "out"), { recursive: true, force: true });
    await cp(exportDir, path.join(root, "out"), { recursive: true });

    console.log("\nStatic export written to ./out");
    console.log("The server build in .next was not touched.");
  } finally {
    await rm(buildDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
