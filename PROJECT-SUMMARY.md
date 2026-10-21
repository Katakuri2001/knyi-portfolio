# K-Nyi Portfolio — Project Summary

## Owner
Khant Nyi Nyi — Professional Performance Marketer (K-Nyi)

## Primary Positioning Statement
"Diagnose First. Strategize Better. Optimize for Growth."

## Professional Focus Areas
- Meta Ads Planning
- Media Buying
- Content Strategy
- Content Planning
- Marketing Analysis
- Audience Research
- Competitor Research
- Campaign Planning
- Creative Testing
- Budget Planning
- Performance Monitoring
- Marketing Optimization

## Professional Background
Freelance content writing and Facebook marketing experience from 2023–2026, with developing specialization in performance marketing.

## Completed Training
- Content Writing — The Burmese Content Academy, 2025
- Graphic Design — Donato, 2023
- Digital Marketing Basic — Digital Face, 2024

## Currently Studying
- Digital Marketing Advanced — Ye Htet
- Digital Marketing Advanced — Bagan Digital Institute

## Second-year university studies, discontinued before graduation

## Website Information Architecture
1. Navigation — floating liquid-glass rail, collapsible to an icon column
2. Hero
3. About
4. Expertise
5. Selected Campaigns
6. Working Method
7. Tools and Capabilities
8. Education and Professional Development
9. Contact
10. Footer

Plus a separate private console at `/admin` for editing the Work section.

## Color Palette (5 tokens)
- bg-dark: rgb(0, 5, 10) — deepest values inside dark plates
- bg-light: rgb(230, 233, 238) — light paper canvas
- fg-dark: rgb(47, 47, 47) — dark/neutral text
- accent-primary: rgb(54, 236, 223) — vivid teal, dark surfaces only
- accent-secondary: rgb(2, 31, 63) — deep teal-navy, dark rooms and CTA fill

Supporting derived tokens: `surface-sunken` rgb(219,224,231) for full-bleed tonal
bands, and `accent-ink` rgb(10,101,96) — the darkened teal that clears WCAG AA
against both light surfaces. Vivid teal reaches only 1.48:1 on paper, so it is
never used as text on light.

## Visual Direction
Liquid Editorial — a performance marketing studio, not a template. Surface rhythm
alternates light paper / sunken band / full-bleed dark room. Liquid glass is the
navigation's signature and appears nowhere else. The hero carries a real photograph
of K-Nyi; the rest of the imagery is a set of inline SVG editorial plates under
`src/components/visuals/`, all `aria-hidden` and free of numbers so none can be
misread as a result. Full design record: `.stitch/DESIGN.md`; rationale and decisions:
`docs/STAGE-2-LIQUID-EDITORIAL.md` and `docs/STAGE-3-PORTRAIT-RAIL-ADMIN.md`.

## Sections Implemented
1. ✅ Navigation — floating liquid-glass rail (desktop, collapsible to an icon column),
   glass dock + expand sheet (mobile)
2. ✅ Hero — asymmetric editorial opening: index marker on a hairline, display headline,
   offset body/ledger, primary + secondary actions, portrait photograph, method line
3. ✅ About — positioning statement, pull statement, three research questions, values,
   experience, research-notes figure
4. ✅ Expertise — full-bleed sunken band; four numbered capability groups
5. ✅ Selected Campaigns — any number of studies, each in one of three distinct modes
   (dark featured room / wide row / offset card), with optional owner-uploaded image
6. ✅ Working Method — four-stage process spine with a loop-back marker
7. ✅ Tools & Capabilities — exposure ledger, separate learning ledger, illustrative figure
8. ✅ Education — dated timeline rail, completed vs ongoing distinguished
9. ✅ Contact — full-bleed dark room, email as primary action, hairline channel ledger
10. ✅ Footer — continues the dark room; brand, positioning, index, legal line

## Content Source of Truth
All section copy reads through `src/lib/content.ts`, from the **content store** in the
database — one JSON document per kind. The console writes that store, so an admin edit
reaches the live page. No section hardcodes a second copy. Case-study metrics render
only when the record supplies them.

The files in `content/` are the **seed**: bundled with the code and used whenever the
store has no row for a kind, so a fresh deployment renders correctly before anything
is seeded. `npm run seed` writes the seed into an empty store. Settings → Content
export downloads the live content, so the repository can be kept in step.

See `docs/STAGE-2-LIQUID-EDITORIAL.md` and `docs/STAGE-7-CLOUDFLARE-WORKERS.md`.

## Admin Console (`/admin`)
A marketing intelligence console with eleven sections: **Overview**, Analytics, SEO
intelligence, Acquisition & campaigns, Conversions & leads, Audience intelligence,
Content & case studies, Experiments & optimisation, Integrations, Reports, Settings.

- Authentication: password via `ADMIN_PASSWORD`; the session cookie is an HMAC keyed by
  that password. Production refuses to start without the variable set.
- The public contact form feeds a real lead pipeline, with attribution recorded at the
  moment of submission
- First-party event tracking: fourteen allowlisted event types, no PII, aggregate and
  pseudonymous only
- A technical SEO audit that checks the site's own pages — and accepts no URL, so it
  cannot be pointed at an internal address
- Per-page metadata editing that the public page actually renders
- Integrations show live status from a real provider check, never from the presence
  of an environment variable
- Case-study CRUD with image upload, alt text and reordering, unchanged in capability
- Lead pipeline: new → contacted → qualified → proposal sent → won → lost → archived
- Data storage: one storage port with two adapters — SQLite at ./data/knyi.db on a
  Node host, D1 on Cloudflare Workers. The same queries run either way. The reviewed
  portfolio copy is in the content store. Images go to public/uploads/ on Node and to
  an R2 bucket on Workers, both served from /api/uploads/<name>
- Writes revalidate the public page (`export const revalidate = 3600` on the route)

## Code Quality
- TypeScript: 0 errors (strict mode)
- ESLint: 0 errors, 0 warnings
- Responsive: verified at 360, 390, 768, 1024, 1440, 1920px — no horizontal overflow
- Accessible: semantic HTML, single h1, correct h2/h3 order, focus rings, skip link,
  44px targets, reduced-motion and `prefers-reduced-transparency` handling
- Contrast: 0 WCAG AA failures across ~250 rendered text samples at 360 / 768 / 1440
- Tests: 62 passing, covering attribution, the event allowlist and its PII rejection,
  lead validation, the date-range maths and the database layer
- Verified end to end against the production build: consent → tracking → contact
  form → stored lead with attribution → console → status update → SEO audit →
  metadata write-through to the live public page → CSV export
- No fabricated metrics: every case-study figure comes from `content/case-studies.json`
  and is labelled as reported, not independently verified
- No decorative motion: the background no longer animates at all

## Technical Stack
- Framework: Next.js 16.4.0 with App Router
- Styling: Tailwind CSS v4 + CSS custom properties for palette
- Fonts: Geist Sans & Geist Mono (self-hosted, `next/font/local`)
- Data: SQLite through a storage port — better-sqlite3 on a Node host, D1 on
  Cloudflare Workers — for leads, events, campaigns, SEO audits, experiments and the
  reviewed portfolio content
- Deployment: Next.js on Node, or the same app on Cloudflare Workers via OpenNext
  (D1 + R2 + the Images binding)
- Auth: Cookie-based, HttpOnly, HMAC-signed, single-owner design
- Tests: Node's built-in runner with native TypeScript — no test framework added
- Images: owner-supplied portrait in /public/images; case-study uploads in
  /public/uploads/ on Node (needs a writable filesystem) or in R2 on Workers

## Optional Integrations (env-var configurable)
See `.env.example` for the full list, grouped by public id vs secret.
- Google Analytics 4: NEXT_PUBLIC_GA_MEASURE_ID (collection), GA4_PROPERTY_ID +
  GOOGLE_SERVICE_ACCOUNT_JSON (reporting)
- Google Search Console: GOOGLE_SERVICE_ACCOUNT_JSON + SEARCH_CONSOLE_SITE_URL
- Meta Pixel: NEXT_PUBLIC_META_PIXEL_ID (+ META_ACCESS_TOKEN for server-side
  conversion forwarding)
- Meta Ads: META_AD_ACCOUNT_ID + META_ACCESS_TOKEN
- Google Ads: GOOGLE_ADS_CUSTOMER_ID + GOOGLE_ADS_DEVELOPER_TOKEN
- Lead notifications: RESEND_API_KEY + LEAD_NOTIFICATION_EMAIL
- Custom domains: knyimediabuyer.xyz, admin.knyimediabuyer.xyz

## Next Steps (Owner Action Required)
1. **Create the Cloudflare resources and deploy the Worker.** The console, the
   public contact form and first-party event ingestion all need a server; GitHub
   Pages serves the public page only. The step-by-step handover is in
   `docs/STAGE-7-CLOUDFLARE-WORKERS.md` — two D1 databases, two R2 buckets, the
   secrets, and `npm run deploy:cloudflare`. A `Dockerfile` and
   `docker-compose.yml` are provided if a Node host is preferred instead.
2. Set `ADMIN_PASSWORD` — production refuses to start without it
3. Set `NEXT_PUBLIC_SITE_URL` to enable the canonical URL, the sitemap and `og:url`
4. Add `GOOGLE_SERVICE_ACCOUNT_JSON` to unlock GA4 reporting and Search Console
5. Add `NEXT_PUBLIC_GA_MEASURE_ID` to unlock GA4 collection
6. Add `NEXT_PUBLIC_META_PIXEL_ID` to unlock remarketing audiences
7. Replace the placeholder contact details (`info@knyi-portfolio.local`,
   `@knyi-portfolio`, `http://localhost:3000`) — edit them from **Settings** in the
   console, which writes the content store, and export the content to keep the
   repository in step
8. Clear the GitHub account's billing lock to re-enable the automatic Pages deploy
9. Decide where the full SEO lockup goes and reconcile "SEO & Marketing" with the
   site's "performance marketer" positioning
