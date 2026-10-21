# K-Nyi Portfolio Project — Agents.md

## Project Overview
Premium personal portfolio website for Khant Nyi Nyi (K-Nyi), performance marketer specializing in Meta Ads planning, content strategy, media buying, campaign analysis, and growth-focused marketing.

## Two Interfaces
1. **Public Portfolio Website** — attracts business owners, agencies, employers
2. **Private Admin Console** — secure content management, SEO, analytics, retargeting, audience personalization, contact leads

## Color Palette (from websitecolorpallet.jpeg)
- Background: rgb(230, 233, 238) — very light grayish blue
- Dark/neutral: rgb(47, 47, 47) — dark gray
- Primary accent: rgb(54, 236, 223) — vivid teal/cyan
- Secondary dark: rgb(2, 31, 63) — deep teal

## Key Directories
- `src/app/(site)/` — the public site (page + chrome layout)
- `src/app/admin/` — the private console for the Work section
- `src/app/api/` — auth, content and upload routes
- `src/components/` — reusable React components
- `src/components/admin/` — console components
- `src/components/visuals/` — inline SVG editorial plates
- `src/lib/` — content layer, auth, uploads, validation
- `content/` — JSON data files (case-studies, services, profile, tools, education, contact-leads)

## Commands
- `npm run dev` — start development server at http://localhost:3000
- `npm run build` — build production (Turbopack)
- `npm run lint` — ESLint type-check
- `npx tsc --noEmit` — TypeScript check
- `npm test` — the test suite (Node's built-in runner, no test framework)
- `npm run migrate` — apply the database migrations (local SQLite)
- `npm run seed` — seed the content store from `content/`
- `npm run prune` — apply the analytics retention policy (run from cron)
- `npm run build:pages` — static export for GitHub Pages into ./out
- `npm run deploy:pages` — build the export and publish it to the gh-pages branch
- `npm run build:cloudflare` — the OpenNext Worker bundle, into .open-next
- `npm run preview:cloudflare` — the Worker locally, against a local D1 and R2
- `npm run deploy:cloudflare` — build and publish the Worker
- `npm run d1:migrate` / `npm run d1:migrate:remote` — apply the schema to D1

## Database
SQLite, through a **storage port** (`src/lib/db/adapter.ts`) with two
adapters: `better-sqlite3` on a disk for Node, and D1 over HTTP for Cloudflare
Workers. Every query is written against the port and runs unchanged in both
places, so the console has one code path.

It holds the **generated and transactional** data: leads, lead notes,
analytics events, sessions, campaign observations, SEO audit runs and issues,
SEO metadata overrides, experiments, and integration state.

The **reviewed portfolio content** — profile, services, tools, education, case
studies — is in the `content_documents` table, one JSON document per kind.
The files in `content/` are the **seed**: they are bundled with the code and
used whenever the store has no row for a kind, so a fresh deployment renders
correctly before anything is seeded. `npm run seed` writes the seed into an
empty store and never overwrites what is there.

Two consequences to keep in mind:
- The console edits the **store**, not the files. Settings → Content export
  downloads the live content so the repository can be kept in step.
- The GitHub Pages export is built from a checkout, so it carries the seed.
  Console edits on Workers reach it only through that export.

Every module under `src/lib/db/` carries `import "server-only"`, so a client
component cannot pull the database into the browser bundle. Types live in
`src/lib/db/types.ts` and `src/lib/db/content-types.ts`, which are safe to
import from either side.

Queries use **positional** `?` parameters, never named ones: `better-sqlite3`
spells named parameters `@name` and D1 spells them `:name`, and only
positional works in both.

## Deployment
There are two live surfaces, and they are independent.

- **GitHub Pages** serves the **public page only**, at
  https://katakuri2001.github.io/knyi-portfolio/ — published from the
  `gh-pages` branch. The console and the API are not there, by design.
- **Cloudflare Workers** serves the **whole application** — the public page,
  the console, the contact form and the analytics — with D1 for the database
  and R2 for uploads. This is the recommended home for everything.

A `Dockerfile` and `docker-compose.yml` are also provided for a Node host; the
database lives on a mounted volume at `/app/data`.

`.github/workflows/deploy-pages.yml` is the automatic route for Pages, but it
is blocked by a **billing lock on the GitHub account** — every workflow fails
with "The job was not started because your account is locked due to a billing
issue". Once billing is cleared, switch Settings → Pages → Source to "GitHub
Actions".

See `docs/STAGE-4-GITHUB-PAGES.md`, `docs/STAGE-6-MARKETING-INTELLIGENCE.md`
and `docs/STAGE-7-CLOUDFLARE-WORKERS.md`.

## Authentication
- Admin console: `/admin` — sign in with `ADMIN_PASSWORD` from the environment
- Session: HttpOnly cookie `admin_session`, an HMAC keyed by the password, 7-day expiry
- Production **refuses to start** without `ADMIN_PASSWORD` set
- Sign out: GET `/api/auth/signout` (or DELETE `/api/auth`)
- The **origin check** on writes compares the browser's `Origin` header against
  the host the visitor addressed, which on Cloudflare Workers comes from
  `x-forwarded-host` — **not** `request.nextUrl.host`, which names the
  internal origin the request was forwarded to. `src/lib/request-origin.ts` is
  the only place that knows this.

## Admin Console
`/admin` — a marketing intelligence console with eleven sections: Overview,
Analytics, SEO intelligence, Acquisition & campaigns, Conversions & leads, Audience
intelligence, Content & case studies, Experiments & optimisation, Integrations,
Reports, and Settings.

- The case-study editor is unchanged in capability — create, edit, delete, reorder,
  and upload a campaign image with alt text.
- The public contact form feeds the lead pipeline, with attribution recorded at the
  moment of submission.
- Every content write calls `revalidatePath("/")`, so a change reaches the public
  site on the next request.
- **Never** link to a route handler with `next/link` — Next prefetches the target,
  which *executes* a GET route handler. Use a button instead. This is how the
  console's own sign-out was silently deleting the session.
- The full audit, the backlog and the open decisions are in
  `docs/STAGE-6-MARKETING-INTELLIGENCE.md`, and the earlier console audit is in
  `docs/STAGE-5-ADMIN-CONSOLE-BACKLOG.md`.

- Requires `ADMIN_PASSWORD`; see `docs/STAGE-3-PORTRAIT-RAIL-ADMIN.md`
- Uploads are written to `public/uploads/` and served from `/api/uploads/<name>`
  — `next start` does not serve files added to `public/` after a build
- Needs a **writable** filesystem; it will not work on read-only serverless hosting
- The public page declares `export const revalidate = 3600`. Without it,
  `revalidatePath("/")` does not regenerate the static route

## Content Management
The portfolio content is read from and written to the **content store** in the
database, one JSON document per kind:
- `case-studies` — case studies with reported/verified flags
- `services` — 3 capability groups (Meta Ads, Content Strategy, Marketing Analysis)
- `profile` — Name, tagline, background, positioning, contact details
- `education` — Completed + currently studying
- `tools` — Practical exposure + currently learning

The files in `content/` are the **seed** for those documents. They are bundled
with the code and used whenever the store has no row for a kind. `npm run seed`
writes the seed into an empty store; it never overwrites what is there.
Settings → Content export downloads the live content, so the repository can be
kept in step with the site.

Leads are **not** content. They live in their own table with a status pipeline
— new, contacted, qualified, proposal sent, won, lost, archived — and are
never written to a file.

## Verification Status
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors, 0 warnings
- ✅ Production build: clean
- ✅ Dev server: `npm run dev` still crashes on this CPU (SWC `SIGBUS`). Use
  `npm run build && npm run start` — this is an environment constraint, not a defect.
- ✅ All 10 required sections implemented
- ✅ No fabricated campaign metrics — every figure comes from `content/case-studies.json`
- ✅ Responsive: 360 / 390 / 768 / 1024 / 1440 / 1920px, no horizontal overflow
- ✅ Accessibility: semantic HTML, single h1, visible focus states, skip link,
  44px targets, reduced-motion and reduced-transparency support, 0 WCAG AA
  contrast failures across ~250 rendered text samples

## Content Source of Truth
Section copy reads from `content/*.json` via `src/lib/content.ts`. Do not hardcode
content that already exists in JSON. Case-study metrics render only when the JSON
provides them — a missing figure is omitted, never invented.

## Visual Direction
Liquid Editorial. See `.stitch/DESIGN.md` for the design record and
`docs/STAGE-2-LIQUID-EDITORIAL.md` / `docs/STAGE-3-PORTRAIT-RAIL-ADMIN.md` for the
reasoning. Three rules to preserve:
1. Glass is the navigation's signature — it appears on the rail and mobile dock only,
   nowhere else on the page.
2. Figures in `src/components/visuals/` are `aria-hidden` inline SVG plates and must
   never carry numbers, axis ticks, dates or dashboard-like data. They are
   illustration, not evidence.
3. The rail collapses to an icon column, and the content gutter shrinks with it
   (`--rail` on `<html data-rail>`). Do not hardcode the gutter width.

## Production Notes
- Public site: knyimediabuyer.xyz (proposed)
- Admin site: admin.knyimediabuyer.xyz (proposed)
- Shared backend API with protected administrative endpoints
- All integration IDs configurable via environment variables
- No hardcoded production credentials

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
