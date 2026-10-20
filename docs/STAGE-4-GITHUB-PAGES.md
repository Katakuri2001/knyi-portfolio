# Stage 4 — GitHub Pages Deployment

**Project:** K-Nyi Portfolio (`knyi-portfolio`)
**Status:** Live at **https://katakuri2001.github.io/knyi-portfolio/**

---

## 1. The constraint

GitHub Pages serves files. It cannot run a server. Three things in this project
need one:

| Needs a server | What it is |
|---|---|
| `/admin` | the console — it reads a session cookie on the server |
| `/api/*` | auth, content CRUD, image upload and serving |
| ISR (`revalidate = 3600`) | the window that lets an admin edit reach the public page |

A static export has none of these. The site therefore ships as **the public page
only**, and the admin console remains a **local tool**:

```
edit content/case-studies.json  →  git commit  →  git push  →  site rebuilds
```

That workflow works because the content layer was already built to read the JSON
files at render time — the JSON is the source of truth, and the console is just a
convenient way to edit it. Run the console locally, commit the JSON it writes,
push.

## 2. Two publishing routes

| | Actions workflow | `gh-pages` branch |
|---|---|---|
| File | `.github/workflows/deploy-pages.yml` | `scripts/deploy-pages.mjs` |
| Builds on | GitHub's runners | your machine |
| Publishes | automatically on every push | when you run `npm run deploy:pages` |
| Needs Actions minutes | yes | no |
| Currently working | **no** | **yes** |

**The Actions workflow is blocked by a billing lock on the account.** Every
workflow — including GitHub's own auto-generated one — fails before its first
step with:

> The job was not started because your account is locked due to a billing issue.

That is an account-level lock on `Katakuri2001`, not a fault in the workflow.
The repository is public, so Actions would normally be free and unlimited; the
lock overrides that. Only the account owner can clear it — see §5.

The branch route was built as the way to get the site live regardless. The
workflow is kept in the repo, correct and ready, so the moment billing is
resolved you can switch the source back to "GitHub Actions" and it takes over
with no further changes.

## 3. How the branch deploy works

`scripts/build-pages.mjs` stages the API routes and the admin console out of
the app directory for the duration of the build, then puts them back — including
when the build fails. GitHub Pages cannot export them, and Next.js refuses to
export a project that contains route handlers.

`scripts/deploy-pages.mjs` then:

1. builds the export with the repository sub-path baked in;
2. copies the export's **contents** into a temporary directory;
3. builds a commit from it using a **temporary index and work tree**, so the
   real working tree and index are never touched — a failed run cannot leave
   the repository on a stray branch with unstaged files;
4. force-pushes that commit to `gh-pages`.

`source.path` is `/`, so the export's contents are the branch root. `out/` is
gitignored and force-added into the temporary index.

## 4. Sub-path handling

A Pages *project* site is served from `https://<user>.github.io/<repo>/`, not
from the domain root. Everything therefore carries `/knyi-portfolio`:

- `basePath` and `assetPrefix` in `next.config.ts` cover the framework's assets;
- `src/lib/paths.ts` covers public images, because `next/image` does **not**
  apply the base path to an unoptimised image's `src` — without it the portrait
  404s on the deployed site;
- `metadataBase` and the canonical URL use the full origin.

**When a custom domain is attached**, set `NEXT_PUBLIC_BASE_PATH` to an empty
string in the workflow and in `scripts/deploy-pages.mjs`, and the site is served
from the domain root with no sub-path.

## 5. What the account owner needs to do

The site is live now and does not need any of this. But if you want the
automatic deploy, or any other GitHub Actions workflow on this account:

1. Go to <https://github.com/settings/billing> (or Settings → Billing and
   licensing) and clear the outstanding invoice, update the payment method, or
   raise the spending limit — whichever is blocking the account.
2. In the repository, go to Settings → Pages → Build and deployment → Source,
   and choose **GitHub Actions**.
3. Push anything to `main` and the workflow publishes.

Until then, `npm run deploy:pages` publishes from your machine.

## 6. Verification

| Check | Result |
|---|---|
| `https://katakuri2001.github.io/knyi-portfolio/` | 200 |
| Portrait, favicon, apple-touch-icon, robots.txt | 200 |
| Stylesheets loaded | 1 |
| Geist Sans and Geist Mono | loaded and applied |
| Canonical URL | `https://katakuri2001.github.io/knyi-portfolio/` |
| `og:image` | absolute, correct path |
| Horizontal overflow | none |
| Console errors | none |

The export was built in a clean clone of the pushed commit, then served locally
under a `/knyi-portfolio` sub-path and driven with Playwright, before being
published — so what was verified locally is byte-identical to what is live.
