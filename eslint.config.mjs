import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The GitHub Pages export builds into its own directory.
    ".next-pages/**",
    // The OpenNext Worker bundle is generated, and it is minified.
    ".open-next/**",
    // The local Cloudflare state — the development D1 database, the local R2
    // buckets — is generated.
    ".wrangler/**",
    // The runtime database is not source.
    "data/**",
  ]),
]);

export default eslintConfig;
