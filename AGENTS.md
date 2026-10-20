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
- `npm run build:pages` — static export for GitHub Pages into ./out
- `npm run deploy:pages` — build the export and publish it to the gh-pages branch

## Deployment
- **Live at https://katakuri2001.github.io/knyi-portfolio/** — published from the
  `gh-pages` branch.
- The published site is the **public page only**. GitHub Pages cannot run a
  server, so `/admin` and `/api/*` are not deployed. Edit content locally
  (or in the local console), commit, and push.
- `.github/workflows/deploy-pages.yml` is the automatic route, but it is blocked
  by a **billing lock on the GitHub account** — every workflow fails with "The
  job was not started because your account is locked due to a billing issue".
  Once billing is cleared, switch Settings → Pages → Source to "GitHub Actions".
- See `docs/STAGE-4-GITHUB-PAGES.md`.

## Authentication
- Admin console: `/admin` — sign in with `ADMIN_PASSWORD` from the environment
- Session: HttpOnly cookie `admin_session`, an HMAC keyed by the password, 7-day expiry
- Production **refuses to start** without `ADMIN_PASSWORD` set
- Sign out: GET `/api/auth/signout` (or DELETE `/api/auth`)

## Admin Console
`/admin` manages the case studies behind the public Work section: create, edit,
delete, reorder, and upload a campaign image. Changes write to
`content/case-studies.json` and regenerate the public page.

- Requires `ADMIN_PASSWORD`; see `docs/STAGE-3-PORTRAIT-RAIL-ADMIN.md`
- Uploads are written to `public/uploads/` and served from `/api/uploads/<name>`
  — `next start` does not serve files added to `public/` after a build
- Needs a **writable** filesystem; it will not work on read-only serverless hosting
- The public page declares `export const revalidate = 3600`. Without it,
  `revalidatePath("/")` does not regenerate the static route

## Content Management
All portfolio content managed via JSON files in `content/` directory:
- `case-studies.json` — case studies with reported/verified flags
- `services.json` — 3 capability groups (Meta Ads, Content Strategy, Marketing Analysis)
- `profile.json` — Name, tagline, background, positioning, contact details
- `education.json` — Completed + currently studying
- `tools.json` — Practical exposure + currently learning
- `contact-leads.json` — Form submissions with status tracking

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
