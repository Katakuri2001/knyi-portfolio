# Stage 6 — Marketing Intelligence & Business Growth Console
## Phase 1: Implementation Inventory & Architecture

**Project:** K-Nyi Portfolio (`knyi-portfolio`)
**Date:** 2026-10-20
**Status:** Implemented and verified end to end against the production build.

---

## 1. Inventory

Every claim below was checked against the code, not against the documentation.

### A. Working and reusable

| Thing | Evidence |
|---|---|
| Next.js 16.4 App Router, React 19.3, Tailwind v4 | `package.json`, `next.config.ts` |
| Content layer reads `content/*.json` at render time | `src/lib/content.ts` — `fs.readFileSync` inside the reader, not a static import |
| Public page is prerendered with a 1h ISR window | `src/app/(site)/page.tsx` — `export const revalidate = 3600`; build output shows `○ / 1h` |
| Auth: HMAC-signed cookie, constant-time compare, fails closed without `ADMIN_PASSWORD` | `src/lib/auth.ts` |
| Case-study CRUD + reorder + image upload + alt text | `src/components/admin/CaseStudyEditor.tsx`, `CaseStudyManager.tsx` |
| Uploaded images served from a route handler | `src/app/api/uploads/[name]/route.ts` |
| Case-study writes revalidate the public page | `src/app/api/content/case-studies/route.ts` — `revalidatePath("/")` |
| Per-type validation with server-generated ids | `src/lib/case-studies.ts` — `sanitiseCaseStudy()` |
| Case-study section renders **any** number of studies | `src/components/CampaignCaseStudySection.tsx` — featured + alternating wide/offset modes |
| robots.txt + sitemap.xml as code-driven metadata routes | `src/app/robots.ts`, `src/app/sitemap.ts` |
| Canonical + Open Graph + Twitter metadata, `metadataBase` | `src/app/layout.tsx` |
| Full Liquid Editorial design system, tokens, editorial primitives | `src/app/globals.css`, `src/components/editorial.tsx` |
| Static export pipeline + Pages workflow | `scripts/build-pages.mjs`, `scripts/deploy-pages.mjs`, `.github/workflows/deploy-pages.yml` |
| Real portrait and brand mark in place | `public/images/portrait-k-nyi.jpg`, `public/images/mark-k-nyi.png` |

### B. Partially implemented — requires completion

| Thing | What exists | What is missing |
|---|---|---|
| **Content CRUD** | 6 content routes; only `case-studies` was wired to a UI | 5 routes unwired; all 5 used the pre-redesign forgeable auth; 4 of 5 could not write; none revalidated; none validated input; no DELETE |
| **Leads** | `content/contact-leads.json` + a CRUD route | **No public form existed** — nothing fed it. Status model was `new → contacted → closed`; the required model is 7 states. One all-empty placeholder row was stored |
| **Deployment** | Site live on GitHub Pages | **Static export only** — no server, so `/admin` and `/api/*` are 404 in production. The console is a local tool |
| **SEO** | robots, sitemap, metadata, canonical, one `h1` | No audit, no per-page metadata editing, no Search Console, no console panel |
| **Analytics** | None | No GA4, no event system, no pixel, no reporting. `NEXT_PUBLIC_GA_MEASUREMENT_ID` appeared in an old doc but **no code ever read it** |
| **Attribution** | None | No UTM capture, no first-touch/last-touch, no campaign records |
| **Tests** | None | No test script, no test files, no runner configured |

### C. Documented but not implemented

| Documented in | Claim | Reality |
|---|---|---|
| `AGENTS.md` "Two Interfaces" | admin console does "SEO, analytics, retargeting, audience personalization" | none of the four existed in any form |
| `PROJECT-SUMMARY.md` (original) | "Google Analytics 4: `NEXT_PUBLIC_GA_MEASUREMENT_ID`" | the variable was read by **no code** |
| `PROJECT-SUMMARY.md` (original) | "Meta Pixel: `NEXT_PUBLIC_META_PIXEL_ID`" | read by **no code** |
| `PROJECT-SUMMARY.md` (original) | "Lead tracking: status workflow (new → contacted → closed)" | the JSON field existed; nothing created leads |
| `PROJECT-SUMMARY.md` (original) | "Custom domains: knyimediabuyer.xyz" | not configured |
| Original Cloudflare spec | Workers + D1 + R2 | **never started**; the project shipped on GitHub Pages instead |

### D. New functionality required

Everything in §4 of the brief: first-party event tracking, consent, the public lead
form, the lead pipeline, campaign attribution, audience aggregates, the technical SEO
audit, Search Console reporting, per-page SEO metadata, the integrations registry, the
experiment log, reports and CSV export, and the eleven-section console navigation.

---

## 2. Architecture decisions

### 2.1 The deployment constraint decides the storage

The site is deployed to **GitHub Pages — a static host with no server**. That rules
out, in production: a public contact form, event ingestion, a server-side SEO audit,
CSV exports, and the console itself.

A marketing intelligence console is a *server* application. It cannot live on a
static host. The upgrade therefore assumes the application is deployed somewhere
that can run Node — which the codebase already is; only the *host* changes.

| | GitHub Pages | Node host |
|---|---|---|
| Public portfolio | ✅ | ✅ |
| Public contact form | ❌ | ✅ |
| First-party event ingestion | ❌ | ✅ |
| Server-side SEO audit | ❌ | ✅ |
| Admin console | ❌ | ✅ |
| File uploads | ❌ | ✅ (already implemented) |
| Cost | free | small VPS |

The GitHub Pages export is **kept** as the public-only mirror — it is fast, free, and
already live. The admin routes are excluded from the export by
`scripts/build-pages.mjs`, which stages them out for the duration of the build.

### 2.2 Storage: SQLite, not JSON, not a hosted service

The brief forbids using a JSON file as an event database, and this is right: analytics
events are append-heavy and queried by date range, which is exactly what JSON is bad
at.

Options considered:

| Option | Verdict |
|---|---|
| **SQLite (`better-sqlite3`)** | **Chosen.** One file, zero ops, free, trivially backed up (copy the file). Synchronous API — ideal for route handlers. Prebuilt binaries install in seconds. Traffic is a personal portfolio: thousands of events a month, not millions |
| Postgres (Neon/Vercel) | Only if the host is serverless with a read-only filesystem. Adds an account, a driver, a connection pool and serverless migrations. Not needed at this scale |
| D1 on Cloudflare | Equivalent to SQLite, but only if the whole app moves to Workers. The project has a Cloudflare spec, but no Cloudflare account is configured here |
| JSON files | Already the content store. **Kept** for the static portfolio content (profile, services, tools, education, case studies) because that content is reviewed, versioned in git, and read at render time. SQLite becomes the source of truth for everything *generated or transactional* |

**Two dependencies added:** `better-sqlite3` (the database) and `server-only` (a
build-time guard that stops a client component importing a server module). No chart
library, no analytics SDK, no Google SDK — the Google integrations are implemented
directly against the REST APIs using Node's built-in `crypto` for RS256 JWT signing.

The database lives at `./data/knyi.db` — a literal path, because a path built from an
environment value makes the bundler trace the whole project into the server output.

### 2.3 Data flow

```
   public page (client)
        │  typed, allowlisted events — no PII
        ▼
   POST /api/track ──► validate ──► rate limit ──► SQLite
        │                                      analytics_events / sessions
        │  consent-gated
        ├──────────────► GA4 Measurement Protocol (browser, consent-gated)
        ▼
   contact form ──► POST /api/leads ──► validate ──► rate limit ──► SQLite
        │                                                  leads (with attribution)
        └──────────────► conversion event ──► analytics_events
                                                   │
   admin console ◄── reads SQLite ◄─────────────────┘
        │
        ├─► GA4 Data API        (service account, optional)
        ├─► Search Console API  (service account, optional)
        └─► Meta Pixel          (browser, consent-gated, optional)
```

### 2.4 Privacy model

- No PII ever reaches an analytics table. The tracker has an **allowlist of event
  names** and a **schema per event**; a payload containing a name, email, phone or
  message is rejected outright, not silently dropped.
- No IP addresses are stored. No device fingerprinting. No third-party enrichment.
- A random pseudonymous visitor id is a 128-bit UUID, rotated on a documented
  retention window (180 days, enforced by `npm run prune`).
- Consent is explicit and granular: **essential** (always on), **analytics**, and
  **marketing**. GA4 and the Meta Pixel only load after the matching consent.
  Submitting a contact form is explicitly *not* treated as marketing consent.
- Lead records live in one table that no public route can reach, and they are never
  sent to an analytics provider or an advertising platform.

### 2.5 Third-party integrations

| Integration | Credential | How |
|---|---|---|
| GA4 collection | `NEXT_PUBLIC_GA_MEASURE_ID` (public) | browser, consent-gated |
| GA4 reporting | `GA4_PROPERTY_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON` | server-side REST + Data API, zero-dep JWT |
| Search Console | `GOOGLE_SERVICE_ACCOUNT_JSON` + `SEARCH_CONSOLE_SITE_URL` | server-side REST, zero-dep JWT |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` (public) | browser, consent-gated |
| Meta Ads | `META_AD_ACCOUNT_ID` + `META_ACCESS_TOKEN` | server-side REST |
| Google Ads | `GOOGLE_ADS_CUSTOMER_ID` + `GOOGLE_ADS_DEVELOPER_TOKEN` | server-side REST |
| Lead notifications | `RESEND_API_KEY` + `LEAD_NOTIFICATION_EMAIL` | server-side REST |

All of them degrade to an **honest disconnected state** with setup instructions when
credentials are absent. None of them ever shows a fabricated result. The status shown
in the console comes from a **live check**, never from the presence of a variable.

---

## 3. What was built

### 3.1 The console — eleven sections

`/admin` with a fixed rail on desktop and a drawer on mobile.

| # | Section | What it actually shows |
|---|---|---|
| 01 | Overview | Visitors, sessions, engaged sessions, organic sessions, enquiries, qualified enquiries, conversion rate, returning-visitor rate — each with its previous-period comparison, suppressed when the sample is too small |
| 02 | Analytics | Session and enquiry trends, channels, devices, every event type, landing pages, case-study interest, and a live event feed |
| 03 | SEO intelligence | The technical audit, Search Console clicks/impressions/CTR/position with top queries and pages, and the per-page metadata editor |
| 04 | Acquisition & campaigns | Channels, landing pages, observed UTM campaigns, the campaign register, and the attribution model spelled out |
| 05 | Conversions & leads | The pipeline, enquiries by campaign, and the full lead manager: search, filter, status, notes, follow-up date, deal value, delete |
| 06 | Audience intelligence | Devices, service interest, most-visited pages and case studies, and the remarketing audiences the site can build |
| 07 | Content & case studies | The existing case-study editor, unchanged in capability, now inside the console |
| 08 | Experiments & optimisation | The hypothesis → change → metric → result log |
| 09 | Integrations | Live status, what each one needs, how to connect it, and a "Test connection" button that actually calls the provider |
| 10 | Reports | Period summaries across traffic, search, campaigns, leads, conversions, content and experiments, plus CSV export |
| 11 | Settings | The profile and contact details, the content inventory, and the environment — showing only *whether* a variable is set, never its value |

### 3.2 The public site

- A real **contact form** in the Contact room, posting to `/api/leads`, with a
  honeypot, spam heuristics, a service selector, and a real success state.
- A **typed event tracker** with fourteen allowlisted events, batching, `sendBeacon`
  on unload, one page view per path, and scroll-depth thresholds.
- A **consent banner** with three levels, remembered for 30 days, and no tracker
  loaded before the choice.
- **Case-study interest** is tracked per study, so the console can show which work
  people actually look at.

### 3.3 The technical SEO audit

It fetches the site's own pages and reports only what it can actually detect:
missing and duplicate titles and descriptions, missing or invalid canonicals, missing
Open Graph and Twitter tags, unexpected `noindex`, missing and multiple `h1`s,
skipped heading levels, missing and empty image alt text, broken internal anchors,
duplicate titles across pages, and the contents of `robots.txt` and `sitemap.xml`.

**SSRF safety:** the audit accepts no URL. Its destinations come from
`PUBLIC_ROUTES` in the repository, so there is no field that could make the server
fetch an arbitrary address. Fetches are timeout-bounded and size-capped.

### 3.4 The metadata editor

Saving an override writes to the database and calls `revalidatePath("/")`. The public
page's `generateMetadata` reads the override, so the change is real: the rendered
title, description, canonical, Open Graph tags and robots directive all follow.
Deleting an override restores the code defaults. Removing the whole site from search
requires a second, explicit confirmation.

### 3.5 The console's material

The console uses the same liquid-glass language as the public site, on the three
things that sit above the data: the **navigation panel**, the **primary actions**,
and the **filter controls**.

Two grades, deliberately:

| Grade | Blur | Used for |
|---|---|---|
| `.glass-panel` | 20px | The floating navigation panel and the mobile drawer |
| `.glass-bar` | 18px | The reporting-period filter trough |
| `.glass-primary` | 16px | Primary actions — deep navy glass with a teal keyline |
| `.glass-surface` | none | Secondary controls, form fields, the reorder buttons — translucency and a specular edge, but **no** backdrop filter |

The last row is the important one. There are dozens of small controls on a console
page, and a backdrop filter on each one is real frame cost for a visual gain
that a specular edge already delivers over flat paper. The blur is spent where
it can be seen: on the three large surfaces.

The navigation is a **floating panel**, inset from the edge with rounded corners,
rather than a docked column — the content column is offset by `--rail` so the two
never overlap. A solid column was the earlier choice, on the grounds that a data
table needs a stable edge; the floating panel is the better answer, because the
panel is narrow and the data sits to its right, not under it.

Everything degrades to an opaque fill where `backdrop-filter` is unsupported, and
to a solid one under `prefers-reduced-transparency`.

---

## 4. Bugs found and fixed during the build

Five real defects, all caught by running the thing rather than reading it.

1. **`next/link` prefetching a route handler cleared the session.** The console's
   "Sign out" was a `Link` to `/api/auth/signout`; Next prefetches its target, and
   prefetching a GET route handler *executes* it — so the session was deleted the
   moment the console rendered. Replaced with a button that calls the endpoint on
   click.
2. **The session cookie was `Secure` in production mode**, so it was rejected over
   plain HTTP and the console could never be signed into locally. The flag is now
   derived from the request's actual protocol (`x-forwarded-proto` behind a proxy),
   not from `NODE_ENV`.
3. **A client component pulled `node:crypto` into the browser bundle** through the
   lead-validation module. The hashing moved into the server-only database module,
   the shared module became isomorphic, and every database module now carries
   `import "server-only"` so the bundler refuses it in a client graph.
4. **The lead search queried a `company` column that does not exist** — every search
   in the console would have 500'd. Found by the database test.
5. **`sharp` could not load**, so the image optimiser 500'd. It was falling back to
   the WASM build whose runtime was missing; `@emnapi/runtime` is now installed and
   libvips 8.18.7 loads correctly.

Two more were wrong paths rather than logic: the console called `/api/admin/seo/audit`
and `/api/admin/seo/metadata`, neither of which existed.

---

## 5. Verification

### 5.1 Automated

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | clean, 20 routes |
| `npm test` | **62 tests, 62 pass, 0 fail** |
| `node scripts/build-pages.mjs` | clean static export; `/admin` correctly excluded |

The test suite uses Node's built-in runner with native TypeScript — no test framework
was added. It covers attribution rules, the event allowlist and its PII rejection, lead
validation and spam heuristics, the date-range maths, the public-route list, and the
database layer (lead pipeline, duplicate rejection, status validation, event
deduplication, retention).

### 5.2 End to end, against the production build

Driven with Playwright against `npm start`:

| Check | Result |
|---|---|
| Consent banner shown, choice stored | ✓ |
| Tracking cookies set (`knyi_vid`, `knyi_sid`) | ✓ |
| Contact form submitted, lead stored with attribution | ✓ |
| Admin sign-in, all **11** console sections load | ✓ |
| The stored lead appears in the console | ✓ |
| A lead status can be changed from the console | ✓ |
| The SEO audit runs and reports pages checked | ✓ |
| A metadata override is saved **and appears in the public page's title** | ✓ |
| CSV export: 200, correct header, correct rows | ✓ |
| Unauthenticated admin API → 401 | ✓ |
| Unauthenticated admin page → redirected to sign-in | ✓ |
| The public tracking endpoint stays public | ✓ |
| No horizontal overflow at 390px, admin or public | ✓ |
| Console errors | **0** |
| Contrast across all 11 console pages, on the glass surfaces | **0 failures**, 748 text samples |

---

## 6. What the owner needs to do

| # | Action | Why |
|---|---|---|
| 1 | **Deploy the app to a Node host** | the console, the lead form and event ingestion all need a server; GitHub Pages cannot run them. A `Dockerfile` and a compose file are provided |
| 2 | Set `ADMIN_PASSWORD` | production refuses to start without it |
| 3 | Set `NEXT_PUBLIC_SITE_URL` | canonical URL, sitemap, social preview, and the audit's own address |
| 4 | Add `GOOGLE_SERVICE_ACCOUNT_JSON` | unlocks GA4 reporting and Search Console |
| 5 | Add `NEXT_PUBLIC_GA_MEASURE_ID` | unlocks GA4 collection |
| 6 | Add `NEXT_PUBLIC_META_PIXEL_ID` | unlocks remarketing audiences |
| 7 | Replace the placeholder contact details | `info@knyi-portfolio.local` is live on the site |
| 8 | Verify the Search Console property | required before query data appears |

`.env.example` lists every variable, grouped by kind, with a note on which are
public ids and which are secrets.

---

## 7. Deliberate omissions

- **No A/B testing engine.** The brief asks for an experiment log and forbids fake
  control/treatment data. A log with hypothesis, metric, dates, result and conclusion
  is the honest first step; a real split-test engine is a later decision, once there
  is enough traffic for a sample to mean anything.
- **No cost-per-lead or ROAS.** There is no advertising spend data source. These would
  be fabricated, so they are not shown — and the console says why.
- **No visitor identity.** A pseudonymous id, never a person.
- **No server-side GA4 conversion forwarding.** The Measurement Protocol secret is
  for a server that already holds a GA4 client id; this console does not. The
  browser snippet sends the conversion with the real client id, which is the
  correct mechanism.
- **The first-party tracker is not a GA4 replacement.** It is a cross-check. Where
  both exist, they are reported separately and never merged.
