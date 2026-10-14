# Cloudflare Workers + D1 Deployment — Design

**Date:** 2026-10-14
**Status:** Draft for review
**Project:** K-Nyi Portfolio (`knyi-portfolio`)

---

## 1. Goal

Move the portfolio off local-only development onto Cloudflare Workers with a real
database, while keeping local development as the primary working environment.

Success means:

- The public site is served from a Cloudflare Worker at a generated `*.workers.dev`
  subdomain.
- All six content types and contact leads live in Cloudflare D1.
- Admin content edits are reachable through an authenticated console, not SQL.
- `next dev` remains the default inner-loop command and works fully offline of
  Cloudflare, against a local D1.
- No custom domain and no DNS changes are made in this phase.

## 2. Non-goals

- Custom domain attachment, DNS, or registrar work.
- Zero-downtime migration or traffic cutover from an existing host (there is none).
- Worker paid plan, Durable Objects, KV, or R2 usage beyond the incremental cache.
- GA4 / Meta Pixel configuration (separate task).
- Redesigning the visual language of the site.

## 3. Current state — findings that drive this design

These are defects discovered during exploration. Each one is a prerequisite, not
a nice-to-have.

### 3.1 Section components hardcode all content

`src/app/page.tsx` renders ten section components with no props:

```tsx
<HeroSection />
<CampaignCaseStudySection />
```

`src/components/CampaignCaseStudySection.tsx` embeds three complete `<article>`
blocks in JSX, with `"US$160"`, `"~200 orders"` and `"US$5"` written inline.
No component imports from `content/`. No page calls the API.

Consequence: **the `content/*.json` files are orphaned data.** They are read only
by the API routes, and no rendered page depends on them. Moving to D1 therefore
requires rewriting all ten section components to accept content as props. This is
the largest single work item in this project and it is frontend work.

### 3.2 `output: "export"` disables the entire API layer

`next.config.ts` sets `output: "export"`. Static export has no server runtime, so
the eight route handlers in `src/app/api/` cannot serve traffic in a static
deploy. `output: "export"` must be removed.

### 3.3 All content routes use the filesystem

Every route in `src/app/api/content/` calls `fs.readFileSync` / `fs.writeFileSync`
against `content/*.json`. Workers has no writable filesystem. This code cannot
run on Workers in any form and is replaced wholesale by D1 access.

### 3.4 Admin auth is not safe to expose publicly

`src/app/api/auth/route.ts`:

```ts
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "knyi-admin-2026";
response.cookies.set("admin_session", "authenticated", { ... });
```

Three distinct defects:

1. **Forgeable session.** The cookie value is the literal string
   `"authenticated"`. There is no signature. Anyone can set that cookie by hand
   and read every stored lead.
2. **No server-side expiry.** `maxAge` is a client hint only; nothing validates
   the token or checks a timestamp server-side.
3. **Hardcoded fallback secret.** If `ADMIN_PASSWORD` is unset, the app silently
   accepts `"knyi-admin-2026"`. A missing env var ships a guessable password.

Deploying as-is would publish an unprotected admin API.

### 3.5 `profile` POST handler is inconsistent

`src/app/api/content/profile/route.ts` treats `profile.json` — a single object —
as an array and appends to it: `[...existing, item]`. This is a latent bug that
becomes harmless once profile is a single-row table.

### 3.6 Referenced images do not exist

`CampaignCaseStudySection` references `/placeholder-building.jpg`,
`/placeholder-paratha.jpg`, `/placeholder-underwriting.jpg`. `public/` contains
none of these — only the default Next.js SVGs. These are broken today.

### 3.7 Content drift between JSON and JSX

`content/case-studies.json` records `averageOrderValue: "US$3"` for the paratha
business. The hardcoded component never renders an average order value for that
card. Per the decision in §6.3, the JSON is authoritative, so this value becomes
visible. **This is a visible change to the public site and is called out here
deliberately.**

### 3.8 Placeholder lead row in seed data

`content/contact-leads.json` contains one row with every field an empty string.
It is not real data and must not be seeded.

## 4. Architecture

```
                    ┌─────────────────────────────────────────┐
   Public visitor ──►  Worker (OpenNext adapter, workerd)     │
                    │                                          │
                    │  ┌────────────────────────────────────┐  │
                    │  │ Assets layer — prerendered HTML    │  │
                    │  │ served before Worker invocation    │  │
                    │  │ cost: 0 CPU on hit                 │  │
                    │  └────────────────────────────────────┘  │
                    │                                          │
                    │  ┌────────────────────────────────────┐  │
                    │  │ Dynamic: /admin/*, /api/*          │  │
                    │  │ cost: CPU, on demand only          │  │
                    │  └────────────────────────────────────┘  │
                    └───────────┬──────────────────┬───────────┘
                                │                  │
                    ┌───────────▼──────┐   ┌───────▼────────┐
                    │       D1         │   │       R2       │
                    │ content + leads  │   │ incremental    │
                    │ + rate limiting  │   │ cache (tags)   │
                    └──────────────────┘   └────────────────┘
```

### 4.1 Adapter: OpenNext

`@opennextjs/cloudflare` is the chosen adapter. Cloudflare's newer `vinext` was
considered and rejected: it is still beta (`1.0.0-beta.9` as of 2026-09), and its
documented gaps include cache components, `"use cache"`, and build-time font
optimisation. This app uses none of those, but OpenNext is stable and this project
has no appetite for a beta runtime in its first production deployment.

Required configuration: `nodejs_compat` compatibility flag and a compatibility
date of `2024-09-23` or later.

### 4.2 Request flows

**Build time**

1. `opennextjs-cloudflare build` runs `next build`.
2. Each public page renders once and reads D1 **from the remote database** via
   the build-time binding. This requires `CLOUDFLARE_API_TOKEN`, an account ID,
   and the D1 database ID to be present in the build environment.
3. The resulting HTML is written to the assets layer.

This is a material constraint: the build is not hermetic. It requires network
access to Cloudflare and valid credentials. A build that cannot reach D1 must
fail loudly rather than emitting pages with empty content.

**Public page, cache hit (the common case)**

1. Request arrives at the Worker.
2. The assets layer matches and returns prerendered HTML.
3. The Worker is never invoked. Zero CPU consumed.

**Public page, cache miss after revalidation**

1. Assets layer misses.
2. Worker invokes, the page's `force-static` render reads D1, HTML is produced.
3. Render is stored in the R2 incremental cache.

**Admin edit**

1. `POST /api/content/<type>` — session cookie verified, body validated.
2. D1 row written.
3. `revalidateTag("content")` called.
4. Tag cache entry purged.
5. Next visitor triggers a fresh D1-backed render.

### 4.3 Local-first guarantee

`initOpenNextCloudflareForDev()` from `@opennextjs/cloudflare` is added to
`next.config.ts`. This makes D1 and R2 bindings available during `next dev`, so
the inner loop stays `npm run dev` against a **local** D1 with zero network calls.
Local secrets live in `.dev.vars`, which is gitignored.

## 5. Data model

Seven tables. Column names are `snake_case`; a data-access layer maps them to the
existing camelCase shapes so component props stay idiomatic TypeScript.

### `profile` — single row, `id` constrained to 1

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | `CHECK (id = 1)` |
| `name` | TEXT | |
| `professional_name` | TEXT | |
| `tagline` | TEXT | |
| `positioning` | TEXT | |
| `background` | TEXT | |
| `how_i_think` | TEXT | from `howITick` |
| `what_i_value` | TEXT | from `whatIVALUE` |
| `location` | TEXT | |
| `remote_availability` | TEXT | |
| `contact_email` | TEXT | |
| `contact_telegram` | TEXT | |
| `contact_phone` | TEXT | |
| `contact_website` | TEXT | |

### `services`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `metaAds` \| `contentStrategy` \| `marketingAnalysis` |
| `title` | TEXT | |
| `description` | TEXT | |
| `experience` | TEXT | |
| `learning` | TEXT | |
| `display_order` | INTEGER | |

### `case_studies`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `a` \| `b` \| `c` |
| `title` | TEXT | |
| `category` | TEXT | |
| `platform` | TEXT | |
| `ad_spend` | TEXT NULL | nullable — case study C has none |
| `duration` | TEXT NULL | |
| `audience_growth` | TEXT NULL | |
| `orders` | TEXT NULL | |
| `average_orders_per_month` | TEXT NULL | case study C only |
| `average_order_value` | TEXT NULL | B and C |
| `scope` | TEXT | |
| `reported` | INTEGER | boolean; drives the honesty disclaimer |
| `verified` | INTEGER | boolean |
| `methodology_note` | TEXT | rendered verbatim |
| `image_path` | TEXT NULL | see §10.3 |
| `display_order` | INTEGER | |

`reported` and `verified` are retained because they enforce the project's
no-fabricated-metrics rule at the data layer, not just in prose.

### `education`

A single table with a `kind` discriminator covers the three shapes in
`education.json`.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `kind` | TEXT | `completed` \| `studying` \| `note` |
| `name` | TEXT | nullable for `note` rows |
| `institution` | TEXT | nullable for `note` rows |
| `year` | INTEGER NULL | absent for `studying` |
| `note` | TEXT NULL | used by the `note` row for university status |
| `display_order` | INTEGER | |

### `tools`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | slugified tool name |
| `name` | TEXT | |
| `category` | TEXT | `exposure` \| `learning` |
| `display_order` | INTEGER | |

### `contact_leads`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `lead-<timestamp>` |
| `name` | TEXT | |
| `email` | TEXT | |
| `telegram` | TEXT | |
| `phone` | TEXT | |
| `message` | TEXT | |
| `status` | TEXT | `new` \| `contacted` \| `closed` |
| `created_at` | TEXT | ISO 8601 |
| `updated_at` | TEXT | ISO 8601 |

### `login_attempts`

Rate-limiting support for the login endpoint.

| Column | Type | Notes |
|---|---|---|
| `key` | TEXT PK | `${ip}:${email}` |
| `attempts` | INTEGER | |
| `window_started_at` | INTEGER | unix seconds |

### 5.1 Migration and seed

- Schema lives in `migrations/0001_init.sql`, applied with
  `wrangler d1 migrations apply`.
- `scripts/seed.ts` reads `content/*.json` and inserts rows, skipping the
  placeholder row described in §3.8.
- **After seeding, `content/*.json` is deleted.** D1 becomes the single source of
  truth in both local and production, so there is no possibility of the two
  environments disagreeing.
- Foreign keys on. `PRAGMA foreign_keys = ON`.

## 6. Key decisions and their rationale

### 6.1 OpenNext over vinext
Stability over build speed. See §4.1.

### 6.2 D1 owns all six content types
Matches the stated intent of a real admin console. The cost is that public pages
need revalidation so admin edits become visible.

### 6.3 D1 is seeded from the JSON files
The JSON files are structured and reviewed, so they are authoritative. The known
consequence is §3.7: the paratha average order value of `US$3` becomes visible
on the public site, where it was previously hidden. This is an accepted visible
change, not a bug.

### 6.4 HMAC-signed sessions, not Cloudflare Access
Single-owner site. A signed token needs no extra Cloudflare product, no Zero
Trust enrolment, and behaves identically in local dev and production. Access
remains available as a later hardening step if wanted.

### 6.5 Free tier with prerendered public pages
Workers Free allows ~10ms CPU per request, which server-rendered React routinely
exceeds. Prerendering keeps public traffic off the CPU budget entirely. Only
admin pages, API routes, and post-revalidation renders consume CPU.

## 7. Authentication design

### 7.1 Secrets

| Secret | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Verifies the login attempt |
| `SESSION_SECRET` | HMAC signing key |

Two separate secrets so the password can be rotated without invalidating every
live session.

**Fail closed.** If either secret is absent, `POST /api/auth` returns 503 and
performs no comparison. The hardcoded `"knyi-admin-2026"` fallback is deleted
outright. Local defaults live in `.dev.vars`, which is gitignored.

### 7.2 Token format

```
base64url(payload) + "." + base64url(hmac_sha256(payload, SESSION_SECRET))
```

Payload: `{ "iat": <unix>, "exp": <unix>, "nonce": <hex> }`, with a 7-day
lifetime.

### 7.3 Verification

1. Split on `.`; reject if not exactly two parts.
2. Recompute HMAC over the payload with `SESSION_SECRET`.
3. Compare with a **constant-time** comparison. A plain `===` leaks timing
   information.
4. Decode payload; reject if `exp` < now.

Every one of these is mandatory. Any failure returns 401 with no detail.

### 7.4 Cookie

`httpOnly`, `secure` in production, `sameSite: "strict"`, `path: "/"`,
`maxAge: 7d`.

### 7.5 Rate limiting

`POST /api/auth` is rate limited to 5 failed attempts per `${ip}:${email}` per
15 minutes, tracked in `login_attempts`. Successful login clears the row. This is
defence in depth against brute force; it is not a substitute for a strong
password.

### 7.6 API surface

- `POST /api/auth` — sign in. (`AGENTS.md` currently documents this as
  `/api/auth/signin`; that documentation is wrong and will be corrected.)
- `GET /api/auth` — session check.
- `GET /api/auth/signout` — clear cookie.

All `/api/content/*` routes require a valid session. This matches existing
behaviour.

## 8. Admin console scope

Minimal and deliberately unstyled beyond what the existing design language
already provides. No component library, no design system work.

- `/admin/signin` — password form, posts to `/api/auth`.
- `/admin` — overview with lead count and content row counts.
- `/admin/leads` — list, filter by status, change status inline.
- `/admin/content/<type>` — edit each of the six content types.

Server-side session check on every admin route; unauthenticated requests redirect
to `/admin/signin`.

## 9. Component refactor

Each section component changes from a hardcoded no-argument component to one that
receives its content as props. `page.tsx` becomes the composition point that reads
D1 and passes data down.

```tsx
// before
<CampaignCaseStudySection />

// after
<CampaignCaseStudySection caseStudies={caseStudies} />
```

Rules:

- Section components stay presentational. No D1 access inside them.
- All D1 access happens in server components or the data-access layer.
- Visual output must not change except where §3.7 explicitly applies.

## 10. Known risks and unresolved questions

### 10.1 `revalidateTag` without a custom domain — HIGHEST UNCERTAINTY

Cloudflare documentation indicates automatic cache purging requires a custom
domain and an API token stored as a secret. We have deliberately deferred custom
domains. Therefore `revalidateTag("content")` may not purge as expected.

This must be verified empirically **before** the rest of the plan is trusted.
Mitigations, in order of preference:

1. Confirm `revalidateTag` works on Workers with a D1 tag cache and no custom
   domain.
2. If not, use an on-demand revalidation endpoint invoked by the admin API.
3. If neither works, fall back to **redeploy-on-edit**: public pages stay
   prerendered exactly as designed, but an admin edit no longer triggers
   revalidation and the content refreshes on the next `opennextjs-cloudflare
   deploy`. This preserves correctness — visitors never see stale or mismatched
   content — at the cost of convenience, since editing requires running a deploy
   command. It is the most conservative option because it changes no code beyond
   dropping the `revalidateTag` call.

The fallback is isolated behind the revalidation helper so adopting it does not
touch the component or data layers.

### 10.2 Turbopack vs webpack

`next.config.ts` contains a custom `webpack` hook adding `postcss-loader` for
CSS. Turbopack ignores `webpack` config. The comment says "Turbopack disabled —
use webpack compiler", but `package.json` does not actually pass `--webpack`.
This inconsistency must be resolved during implementation: either the webpack
hook is removed in favour of native Tailwind v4 handling, or the build script
explicitly passes `--webpack`.

### 10.3 Missing images

The three `placeholder-*.jpg` files do not exist. Case study cards will render
with broken images until real assets are supplied. `image_path` is nullable in the
schema so this does not block deployment; the component renders a neutral
placeholder block when it is null. Supplying real imagery is a separate task.

### 10.4 Git repository is not initialised

The project is not a git repository. Deployment via Workers Builds requires one.
`git init` and an initial commit are prerequisites for the CI path, and `.dev.vars`
must be added to `.gitignore` (the existing `.env*` rule does not cover it).

### 10.5 Font fetching at build time

`layout.tsx` uses `next/font/google` (Geist, Geist Mono), which fetches from
Google at build time. Builds will fail without network access. Self-hosting the
fonts is a possible follow-up; not required for this phase.

## 11. Sequencing

Phases are ordered so that each ends in a verifiable state.

1. **Foundation** — remove `output: "export"`, add OpenNext, `wrangler.jsonc`,
   `open-next.config.ts`, `.dev.vars`, `.gitignore` entry. Verify
   `opennextjs-cloudflare build` and `preview` work with no database.
2. **Risk resolution (§10.1)** — prove whether `revalidateTag` purges without a
   custom domain, using a minimal tag and a D1 table. Decide the revalidation
   strategy before writing more code.
3. **Database** — migrations, seed script, data-access layer. Verify local D1
   round-trips.
4. **Auth** — HMAC sessions, rate limiting, removal of the hardcoded fallback,
   corrected `AGENTS.md` endpoint documentation. Verify a forged cookie is
   rejected.
5. **Component refactor** — all ten sections become data-driven.
6. **Admin console** — sign-in, leads, content editors.
7. **Deploy** — create D1 and R2 remotely, apply migrations, seed, set secrets,
   deploy to `*.workers.dev`, verify.

## 12. Verification criteria

The phase is complete only when all of these are demonstrated:

- `npm run dev` serves the site locally against local D1 with no network calls.
- `npx tsc --noEmit` reports 0 errors.
- `npm run lint` reports 0 errors and 0 warnings.
- A request for `/` is served by the assets layer without invoking the Worker.
- An admin edit is visible on the public site without a redeploy — **or** the
  §10.1 fallback is documented and working.
- A hand-crafted `admin_session=authenticated` cookie is rejected with 401.
- `POST /api/auth` with no `ADMIN_PASSWORD` set returns 503, never 200.
- 5 failed login attempts trigger the rate limit, and a 6th attempt within the
  15-minute window is refused regardless of the password supplied.
- No route under `src/app/api/` imports `fs`.
- The deployed URL loads over HTTPS with no console errors.

## 13. Out of scope for this phase

Custom domains and DNS, GA4, Meta Pixel, real case-study imagery, Cloudflare
Access, email delivery for lead notifications, and any visual redesign.