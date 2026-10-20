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
All section copy reads from `content/*.json` through `src/lib/content.ts`, which reads
the files from disk at render time so admin edits reach the live page. No section
hardcodes a second copy. Case-study metrics render only when the JSON supplies them.
See `docs/STAGE-2-LIQUID-EDITORIAL.md`.

## Admin Console (`/admin`)
- Authentication: password via `ADMIN_PASSWORD`; the session cookie is an HMAC keyed by
  that password. Production refuses to start without the variable set.
- Manages the Work section: create, edit, delete, reorder, and upload a campaign image
  with alt text
- API routes: auth (3 verbs), 6 content routes, case-study upload, upload serving
- Data storage: JSON files in /content/; images in public/uploads/ served from
  /api/uploads/<name>
- Writes revalidate the public page (`export const revalidate = 3600` on the route)
- Lead tracking: status workflow (new → contacted → closed)

## Code Quality
- TypeScript: 0 errors (strict mode)
- ESLint: 0 errors, 0 warnings
- Responsive: verified at 360, 390, 768, 1024, 1440, 1920px — no horizontal overflow
- Accessible: semantic HTML, single h1, correct h2/h3 order, focus rings, skip link,
  44px targets, reduced-motion and `prefers-reduced-transparency` handling
- Contrast: 0 WCAG AA failures across ~250 rendered text samples at 360 / 768 / 1440
- No fabricated metrics: every case-study figure comes from `content/case-studies.json`
  and is labelled as reported, not independently verified
- No decorative motion: the background no longer animates at all

## Technical Stack
- Framework: Next.js 16.4.0 with App Router
- Styling: Tailwind CSS v4 + CSS custom properties for palette
- Fonts: Geist Sans & Geist Mono (self-hosted, `next/font/local`)
- Data: JSON files on disk (no database required)
- Auth: Cookie-based, HttpOnly, HMAC-signed, single-owner design
- Images: owner-supplied portrait in /public/images; case-study uploads in
  /public/uploads/ (needs a writable filesystem)

## Optional Integrations (env-var configurable)
- Google Analytics 4: NEXT_PUBLIC_GA_MEASUREMENT_ID
- Meta Pixel: NEXT_PUBLIC_META_PIXEL_ID
- Custom domains: knyimediabuyer.xyz, admin.knyimediabuyer.xyz

## Next Steps (Owner Action Required)
1. Set ADMIN_PASSWORD environment variable for admin access
2. Set NEXT_PUBLIC_SITE_URL to enable the canonical URL and `og:url` (omitted until then)
3. Configure GA4 measurement ID if desired
4. Configure Meta Pixel ID if desired
5. Supply a real portrait and campaign photography (swap points documented in
   `src/components/visuals/`)
6. Replace the placeholder contact details in `content/profile.json`
   (`info@knyi-portfolio.local`, `@knyi-portfolio`, `http://localhost:3000`)
