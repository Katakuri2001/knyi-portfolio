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
- `src/app/` — Next.js 16 App Router pages and layout
- `src/components/` — 12+ reusable React components
- `src/app/api/` — 8 API routes (auth + 6 content routes)
- `content/` — JSON data files (case-studies, services, profile, tools, education, contact-leads)

## Commands
- `npm run dev` — start development server at http://localhost:3000
- `npm run build` — build production (Turbopack)
- `npm run lint` — ESLint type-check
- `npx tsc --noEmit` — TypeScript check

## Authentication
- Admin sign-in: POST to `/api/auth/signin` with password from `ADMIN_PASSWORD` env var
- Session: HttpOnly cookie `admin_session`, 7-day expiry
- Sign out: GET `/api/auth/signout`

## Content Management
All portfolio content managed via JSON files in `content/` directory:
- `case-studies.json` — 3 case studies with reported/verified flags
- `services.json` — 3 capability groups (Meta Ads, Content Strategy, Marketing Analysis)
- `profile.json` — Name, tagline, background, positioning, contact details
- `education.json` — Completed + currently studying
- `tools.json` — Practical exposure + currently learning
- `contact-leads.json` — Form submissions with status tracking

## Verification Status
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors, 0 warnings
- ✅ Dev server: http://localhost:3000
- ✅ All 10 required sections implemented
- ✅ No fabricated campaign metrics
- ✅ No generic design tropes (no purple gradients, glassmorphism, decorative blobs)
- ✅ Responsive: 360px - 1920px
- ✅ Accessibility: semantic HTML, focus states, alt text, prefers-reduced-motion

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
