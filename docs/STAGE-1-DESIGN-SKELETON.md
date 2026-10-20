# Stage 1 — Design & Skeleton

**Project:** K-Nyi Portfolio (`knyi-portfolio`)
**Stage:** Design and skeleton — the visual foundation. No database, no admin console, no deployment.
**Status:** Active

---

## Purpose of this stage

Make the site look designed and feel alive, using only the skeleton that exists today.
Content stays hardcoded in components; there is no CMS, no auth, no analytics.

This stage owns visual quality. It explicitly does **not** own infrastructure.

---

## Definition of done

- [ ] Background reads as textured paper, not a flat fill
- [ ] Content reveals on scroll with a reduced-motion escape hatch
- [ ] Hover/focus transitions consistent across all interactive elements
- [ ] Site remains fully readable with JavaScript disabled
- [ ] All contrast ratios still pass WCAG AA after the changes
- [ ] No new runtime dependency added to `package.json`
- [ ] No horizontal overflow at 360 / 390 / 768 / 1024 / 1440 / 1920px

---

## Completed

### Editorial visual system

The page read flat because every section had identical weight: `text-4xl` headings,
`py-24` everywhere, and three same-sized white boxes repeated twice. Fixed by:

- [x] Display type scale via `@utility`: `text-display` (clamp to 7.5rem), `text-title`
      (to 4.5rem), `text-lede`, `text-eyebrow`, `text-index`
- [x] Section rhythm utilities `section-lead` / `section-body` / `section-tight` so
      sections no longer share one padding value
- [x] Featured case study promoted to a full-width dark anchor; the other two become
      supporting cards — variation instead of three identical blocks
- [x] Capabilities, tools, education, and process stages restructured onto hairline
      rules and index numerals instead of uniform card grids
- [x] `--color-surface`, `--color-surface-sunken`, `--color-ink`, `--color-cta` tokens

### Glass sidebar navigation

- [x] Top bar replaced with a floating vertical rail, inset `left-6`, vertically
      centred, sized to its content (132x299px in a 1440x900 viewport — not full height)
- [x] Glass treatment: `backdrop-blur-xl` + `backdrop-saturate-150`, 72% white fill,
      1px highlight border, soft shadow. Fill opacity is deliberately high so text on
      top still clears AA — the blur carries the glass read, not the transparency
- [x] Hover: accent bar grows 0 to 6px, label nudges right, index numeral fades in,
      300ms transitions throughout
- [x] Active-section dot indicator driven by IntersectionObserver
- [x] Mobile collapses to a glass pill that expands in place via a grid-rows
      transition; the toggle icon rotates 90 degrees on open
- [x] Skip-to-content link added
- [x] `main` reserves `lg:pl-[13.5rem]` so content never slides under the rail

> This supersedes the `AGENTS.md` line "no glassmorphism". Glassmorphism is now an
> explicit requirement for the navigation and other surfaces.

### Build unblocking

The site did not build at all before this stage. Four stacked blockers, each hiding the next:

- [x] SWC native binary raised `SIGBUS` on this CPU → installed `@next/swc-wasm-nodejs`
- [x] `next.config.ts` had a webpack hook pushing `postcss-loader` (not installed, ignored by Turbopack) → removed
- [x] `next/font/google` could not reach Google Fonts at build time → self-hosted Geist into `src/app/fonts/`
- [x] **Tailwind never ran.** v3 `@tailwind` directives in a v4 project, so `@theme` parsed as an unknown at-rule. The build *succeeded* while emitting unstyled HTML, with only a warning. Added `@tailwindcss/postcss` and rewrote the palette as a v4 `@theme` block.

> Environment note: on this machine `npm run dev` still crashes. Use `npm run build && npm run start`. This is a CPU constraint, not a code defect.

### Structural integrity

- [x] Added `id` to every section — all six nav anchors were dead
- [x] Built a real mobile menu (was a button with no handler; phones had no navigation)
- [x] Replaced 4 missing images with `PlaceholderPanel` (typographic stand-in, in-palette)
- [x] Removed duplicate `<nav>` and nested `<main>`
- [x] Fixed `text-background` painting body copy the same colour as its background

### Colour and contrast

- [x] `--color-muted` only reached 2.34:1 as body copy → added `--color-muted-text` at 4.5:1+
- [x] Brand teal `rgb(54,236,223)` reaches 1.48:1 on light → added `--color-accent-ink` for teal-on-light, vivid teal reserved for dark surfaces
- [x] Footer and contact inherited light-mode text on near-black → added `--color-on-dark` / `--color-on-dark-muted`

**Verified:** 0 contrast failures across 27 samples, 0 dead anchors, 0 broken images, 0 console errors, 0 failed requests.

---

## Todo

### 1. Background depth — textured light

**Problem:** the page is a single flat `rgb(230,233,238)` fill. It reads as blunt because there is nothing for the eye to read depth from.

**Direction:** keep the flat base, add fine grain plus soft teal washes behind the hero and section headings. Should read as paper and light, not decoration.

**Constraint:** must stay within the existing palette and respect the `AGENTS.md` ban on decorative blobs and glassmorphism.

- [ ] Grain/noise layer — inline SVG `feTurbulence`, fixed position, very low opacity, `pointer-events-none`
- [ ] Soft radial teal wash behind the hero
- [ ] Per-section washes behind headings, varied in position and size so the page has rhythm
- [ ] Verify grain does not harm text rendering or hurt contrast
- [ ] Verify grain does not tile visibly or band on large viewports
- [ ] Respect `prefers-reduced-motion` if the grain animates

**Files:** `src/app/globals.css`, `src/components/HeroSection.tsx`, `src/components/AboutSection.tsx`

### 2. Scroll reveal

**Problem:** sections arrive all at once with no sense of pacing.

**Direction:** content fades and rises slightly as it enters the viewport, with a small stagger for lists.

**Constraints:**
- IntersectionObserver, **no GSAP** — keeps the dependency count at zero
- Whole behaviour disabled under `prefers-reduced-motion`
- Must degrade gracefully: content visible without JavaScript, revealed via CSS only once JS confirms support
- Stagger capped at 0.04s per item, reveal duration 300–400ms, y-offset 8–16px

- [ ] `Reveal` client component wrapping children
- [ ] Optional `stagger` prop for lists (tools, case studies, education)
- [ ] `prefers-reduced-motion` guard — render final state immediately
- [ ] No-JS fallback: content must not be invisible
- [ ] Unobserve after reveal so the effect fires once
- [ ] Verify no layout shift (CLS) as elements reveal

**Files:** new `src/components/Reveal.tsx`, applied across section components

### 3. Transition consistency

- [ ] Audit every interactive element for consistent `transition` timing
- [ ] Uniform hover treatment on links, buttons, cards
- [ ] Card hover states on case studies and capability blocks
- [ ] Smooth in-page anchor scrolling (`scroll-behavior: smooth`), off under reduced motion
- [ ] Verify focus-visible rings remain visible on all interactive elements

### 4. Layout polish — deferred within this stage

Carried over from the design review, not yet started:

- [ ] Page is very tall — `py-24 md:py-32` on all ten sections gives weak rhythm
- [ ] Hero and about sections use a different alignment rhythm from the rest
- [ ] "What I Do" card is near-white on light grey — weak separation from background
- [ ] Case-study metric labels could use stronger hierarchy
- [ ] Verify against 1920px — not yet audited at that width

### 5. Imagery

- [ ] Real portrait and case-study photography, dropped into `public/`
- [ ] Replace `PlaceholderPanel` usages
- [ ] Confirm `alt` text is descriptive and matches the actual content

---

## Explicitly out of scope for this stage

Deferred to later stages. Not started, not planned here:

- Cloudflare Workers / Pages deployment
- D1 database and content schema
- Admin console and authentication
- Analytics and tracking (GA4, Meta Pixel)
- Custom domain and DNS
- Wiring section components to read from a database

A design spec covering the deployment and database work exists at
`docs/superpowers/specs/2026-10-14-cloudflare-workers-d1-deployment-design.md`
and is **not started**.

---

## Known content drift

**Resolved in Stage 2 (see `docs/STAGE-2-LIQUID-EDITORIAL.md`).** The root cause was
that every section hardcoded a second copy of the strings in `content/`. Stage 2
removed the copies and made the JSON the single source of truth at build time via
`src/lib/content.ts`.

- `case-studies.json` records `averageOrderValue: "US$3"` for the paratha business.
  The hardcoded JSX never rendered it. **Now rendered**, because the case-study
  section derives its metric list from whichever fields the JSON supplies.
- `contact-leads.json` still contains one placeholder row with every field empty.
  Not real data; still not seeded. The public site does not read it.

---

## Verification gate

This stage is not complete until all of the following are demonstrated:

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 errors, 0 warnings
- [ ] `npm run build` → clean, no warnings
- [ ] Content readable with JavaScript disabled
- [ ] Reduced-motion preference honoured for all new motion
- [ ] 0 WCAG AA contrast failures
- [ ] No horizontal overflow at 360 / 390 / 768 / 1024 / 1440 / 1920px
- [ ] Screenshots captured at mobile / tablet / desktop and reviewed