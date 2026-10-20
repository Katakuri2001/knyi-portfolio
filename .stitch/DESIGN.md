---
name: K-Nyi Portfolio
colors:
  background: '#e6e9ee'
  background-dark: '#00050a'
  background-muted: '#c9d1d4'
  surface: '#ffffff'
  surface-sunken: '#dbe0e7'
  foreground: '#2f2f2f'
  muted: '#646464'
  muted-text: '#4a5056'
  on-dark: '#e6e9ee'
  on-dark-muted: '#969ea5'
  accent-ink: '#0a6560'
  accent-primary: '#36ecdf'
  accent-secondary: '#021f3f'
  cta: '#021f3f'
  on-cta: '#ffffff'
  border: '#c9d1d4'
  glass: '#f8fafc'
typography:
  display:
    fontFamily: Geist Sans
    fontSize: 5.25rem
    fontWeight: '600'
    lineHeight: 0.94
    letterSpacing: -0.036em
  title:
    fontFamily: Geist Sans
    fontSize: 3.6rem
    fontWeight: '600'
    lineHeight: 0.98
    letterSpacing: -0.032em
  subtitle:
    fontFamily: Geist Sans
    fontSize: 1.875rem
    fontWeight: '600'
    lineHeight: 1.12
    letterSpacing: -0.022em
  lede:
    fontFamily: Geist Sans
    fontSize: 1.375rem
    fontWeight: '400'
    lineHeight: 1.55
    letterSpacing: -0.008em
  eyebrow:
    fontFamily: Geist Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 1.2
    letterSpacing: 0.2em
  meta:
    fontFamily: Geist Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.45
    letterSpacing: 0.06em
  index:
    fontFamily: Geist Mono
    fontSize: 4.75rem
    fontWeight: '500'
    lineHeight: 0.85
    letterSpacing: -0.05em
  body:
    fontFamily: Geist Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 1.6
    letterSpacing: '0'
rounded:
  button: 0.25rem
  control: 0.75rem
  rail: 1.6rem
  pill: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  section-lead: clamp(4rem, 8vw, 8rem)
  section-body: clamp(3.25rem, 6.5vw, 6.5rem)
  section-tight: clamp(2.5rem, 5vw, 4.5rem)
  content-max: 92rem
  edge: 1.5rem
  rail-offset: 12.5rem
---

# Design System: K-Nyi Portfolio — Liquid Editorial

**Project ID:** knyi-portfolio (local Next.js 16 / React 19 / Tailwind CSS v4)

## 1. Visual Theme & Atmosphere

A personal performance-marketing portfolio set like a magazine rather than a
dashboard. The page runs on a cool grey-blue paper canvas, typeset hard with a
tight display scale, indexed with mono numerals, and cut together with hairline
rules. Tone of voice: a strategist's notebook that has been professionally set.
Whitespace is generous but the grid is disciplined — asymmetry comes from where
blocks sit, not from random offset.

**Surface rhythm.** The page alternates between four surfaces so that no two
consecutive sections feel alike: light paper, a **sunken tonal band** (Expertise,
Tools), a **full-bleed dark room** (featured case study, Contact + Footer), and
light paper again. Tonal change, not card count, is what separates the sections.

**The background is layered, not decorated.** A fixed, static stack sits behind
everything: fine paper grain (inline SVG `feTurbulence`, 180px tile), an almost
imperceptible laid-paper crosshatch, one wide soft teal wash anchored behind the
hero, a top light-falloff, and a floor that falls off to clean paper below the
fold. Nothing in that stack animates. The old drifting radial fields are gone —
the page must look finished with motion disabled, and it must not read as a page
of glowing orbs.

**Glass is the navigation's signature, not the page's texture.** Liquid glass
appears in exactly two places: the floating vertical rail and the mobile dock /
expand sheet. Fill is held high (82%) so labels stay legible whether the rail
floats over paper or over the dark room; the blur and a specular top streak carry
the material read, not the transparency. Every other surface is flat, opaque, and
separated by rules and tonal shifts.

**Motion is restrained and progressive.** Content fades and rises 12px as it
enters the viewport through an IntersectionObserver-based `Reveal` (350ms,
`cubic-bezier(.22,.61,.36,1)`), with a small per-element delay. Content renders
visible in the markup and is only hidden after JS confirms motion is allowed and
the element is below the fold. With JavaScript off, before hydration, or under
`prefers-reduced-motion`, everything is simply visible.

## 2. Color Palette & Roles

### Primary Foundation
- **Light Canvas** (`#e6e9ee`) — the page background; a cool grey-blue, never pure white.
- **Deep Teal-Black** (`#00050a`) — deepest values inside dark plates and figures.
- **Deep Teal-Navy** (`#021f3f`) — the "room" colour: featured case study, Contact,
  Footer. Opaque, so the atmosphere never bleeds through.
- **Sunken Surface** (`#dbe0e7`) — the full-bleed tonal band behind Expertise and Tools.
- **White Surface** (`#ffffff`) — plate fills inside figures, node plates in diagrams.
- **Muted Canvas** (`#c9d1d4`) — hairlines, borders, inactive markers.

### Accent & Interactive
- **Vivid Teal** (`#36ecdf`) — the brand accent, reserved for **dark surfaces
  only**: the featured case-study ledger labels, section markers in dark rooms,
  focus rings on dark, the email link, figure keylines. It reaches only 1.48:1 on
  paper, so it is never used as text on light.
- **Teal Ink** (`#0a6560`) — the darkened teal used everywhere on light surfaces:
  eyebrows, index numerals, list markers, lede emphasis. Darkened until it clears
  WCAG AA against the *darker* of the two light surfaces — 5.2:1 on the sunken band,
  5.5:1 on paper.
- **Deep Teal-Navy** (`#021f3f`) doubles as the CTA fill on light (`bg-cta`) with white text.

### Typography & Text Hierarchy
- **Dark Ink** (`#2f2f2f`) — primary body and heading colour on light.
- **Accessible Muted** (`#4a5056`) — all supporting body copy (`text-muted-text`).
- **On-Dark White** (`#e6e9ee`) — primary text on dark rooms.
- **On-Dark Muted** (`#969ea5`) — secondary text on dark rooms.
- **Mid Grey** (`#646464`) — reserved for non-essential decoration only; never body copy.

### Functional States
- **Focus** — `2px solid var(--color-accent-ink)` with a 3px offset, applied globally via `:focus-visible`.
- **Active navigation** — signalled three ways so it never depends on colour alone:
  a filled surface, a teal bar on the leading edge, a teal index numeral, plus
  `aria-current="location"`.
- No success/error/warning tokens exist; do not invent them.

## 3. Typography Rules

### Font Families
- **Geist Sans** — display, headings, body, labels. Self-hosted variable weight
  (100–900) via `next/font/local`, `display: swap`. Neutral, slightly geometric.
- **Geist Mono** — eyebrows, index numerals, metadata, figure captions, ledger
  labels. Same variable weight range.

### Hierarchy & Weights
- **Display** (`text-display`): clamp(2.6rem → 5.25rem), weight 600, line-height
  0.94, letter-spacing -0.036em. Hero headline and the Contact headline only —
  set on three deliberate lines so the block has a shape.
- **Title** (`text-title`): clamp(2rem → 3.6rem), weight 600, line-height 0.98,
  letter-spacing -0.032em. Section headings, set on two lines with the second line
  de-emphasised in muted grey.
- **Subtitle** (`text-subtitle`): clamp(1.375rem → 1.875rem), weight 600. Pull
  statements, card titles, and every ledger value.
- **Lede** (`text-lede`): clamp(1.0625rem → 1.375rem), line-height 1.55. Supporting copy.
- **Eyebrow** (`text-eyebrow`): mono, 0.6875rem, weight 500, letter-spacing 0.2em,
  uppercase. Section labels.
- **Metadata** (`text-meta`): mono, 0.75rem. Small labels — deliberately not
  smaller than 12px, so metadata stays readable rather than merely fashionable.
- **Index** (`text-index`): mono, clamp(2.75rem → 4.75rem), letter-spacing -0.05em.
  Oversized numerals that anchor each section or list.
- **Figure caption** (`figure-caption`): mono, 0.6875rem, uppercase, 0.14em tracking.

### Spacing Principles
Display type is tracked tight (-0.032em to -0.036em); body copy is tracked neutral
and set at 1.55–1.6 line-height. Body measure is capped by the grid, not by
`<p>` width. Headings sit on a hairline rule with generous space beneath; the rule
is the recurring structural marker that replaces card chrome.

## 4. Component Stylings

### Buttons
- **Primary CTA** (`.cta-primary`): deep navy `#021f3f` block, 0.25rem radius, an
  inset 2px teal keyline on its bottom edge, white label, 0.9375rem/500. Hover
  lifts 2px and thickens the teal keyline to 3px. No blur, no glass.
- **Secondary** (`.cta-secondary`): bare label on a 1px bottom border that goes teal
  on hover. Used for the "see selected campaigns" style action.
- Both use a 180ms `var(--ease-out)` transition.

### Ledgers, Rows & Notes
- **Ledger** — label on the left in mono, value on the right at `text-subtitle`,
  1px hairline above each row and below the last. This is the workhorse for case
  study metrics, education entries and tool lists. Rows that need an explicit
  variant use `ledger-row--dark`.
- **Note** — 2px left border, optional uppercase label, 0.8125rem supporting copy.
  Used for methodology caveats and the university status. Never rounded.
- **Tick** — a 0.5rem × 1px teal rule used as a list marker and as a label leader.

### Cards & Containers
There is no generic card component, by design. Case studies are three separate
compositions rather than one repeated block:
- **Mode A — featured**: full-bleed dark room, 12-column split, large creative
  plate on the left, headline and metric ledger on the right, `Reported figures`
  tag and methodology note beneath.
- **Mode B — wide row**: horizontal split, plan-structure diagram beside the text.
- **Mode C — offset card**: narrower, pushed off the centre line, oversized index
  numeral living in the outer margin rather than inside a box.
Expertise, tools and education use open hairline rows on the band surface, not cards.

### Navigation
- **Desktop rail**: fixed, vertically centred, inset `left: 24px`, 11rem wide,
  sized to its content, `max-h: calc(100dvh - 1.5rem)` with a slim styled
  scrollbar for short viewports. Liquid glass: 82% light fill,
  `blur(20px) saturate(180%)`, a 1px specular streak on the top edge via
  `::before`, a soft ambient shadow, and a teal-tinted inner ring. Each item is
  44px tall.
- **Collapsed rail**: 3.25rem, icons only, labels removed from the visual flow
  but kept in the accessibility tree. The reserved band (`--rail`) shrinks with
  it, so the content measure widens by 120px and the grid re-wraps — collapsing
  is a layout change, not just a paint change. The state persists in
  `localStorage`, read through `useSyncExternalStore` so hydration matches.
  The toggle is a `<button>` with `aria-expanded` and a changing label.
- **Mobile dock**: a bottom glass pill pinned with `env(safe-area-inset-bottom)`,
  four primary items plus a "Menu" toggle that expands an "All sections" sheet
  above it. Targets are 69×51. Active state adds a teal bar under the label so it
  is not colour-only. Escape closes the sheet and returns focus to the toggle.

### Figures & Plates
Figures are **inline SVG components** in `src/components/visuals/` — no bitmap
ships, no request is made, no layout shift occurs, and each is crisp at any size.
They are art-directed in the brand palette and are always `aria-hidden`: the
information they carry lives in real HTML around them. Every plate is free of
numbers, axis ticks, dates and platform chrome, so none of them can be mistaken
for a result. A plate with no honest caption is a lie told in vector form.
- The hero carries a **real photograph** of K-Nyi (`/images/portrait-k-nyi.jpg`,
  4:5, 1000×1250) via `next/image`. The typographic `PortraitPlate` stand-in was
  deleted once the photograph arrived.
- `CampaignCreativeFigure` — 4:5 / 1:1 / 9:16 creative frames, abstract.
- `CampaignStructureFigure` — hub-and-spoke of objective / audience / creative /
  budget / measure. Structure, not magnitude.
- `AudienceResearchFigure` — segmentation matrix with three highlighted cells.
- `ResearchNotesFigure` — stacked working documents with one flagged callout.
- `SearchPerformanceFigure` — abstract SERP rows plus a visibility band.

### Inputs & Forms
No input components exist on the public site. The contact section is a set of
ledger rows and `mailto:` / `tel:` / `t.me` links rather than a form.

### Admin Console
`/admin` is a working tool, not a composition: same tokens, same type scale,
same hairline ledger rows, same teal accents, but a fixed header instead of a
floating rail and no atmosphere layer. Sign-in is an editorial card on paper.
Rows are label/value ledgers with a thumbnail column and hairline separators —
never shadowed cards.

---

## 5. Layout Principles

### Grid & Structure
- **`.shell`** is the only place gutters live: `max-width: 92rem`, centred,
  `padding-inline: 1.5rem` → `2.5rem` (≥640px) → `3rem` (≥1024px). At ≥1024px
  the left padding becomes `calc(--rail + 3rem)`, where `--rail` is 12.5rem
  expanded and 5rem collapsed — published on `<html data-rail>` by the nav.
- `main` carries **no** gutter, so every section spans the full viewport and a
  dark or sunken band reaches both edges for free while its contents stay on one
  optical column.
- Body copy is a 12-column grid. Asymmetry comes from asymmetric spans — 7/5,
  4/3/5, 1/4/6 — never from arbitrary offsets.

### Whitespace Strategy
- 4px base unit. Section padding is fluid, not fixed:
  `section-lead` clamp(4rem, 8vw, 8rem), `section-body` clamp(3.25rem, 6.5vw, 6.5rem),
  `section-tight` clamp(2.5rem, 5vw, 4.5rem).
- A hairline rule with 1.25rem of padding above it is the standard section marker.
  Headings never sit in a floating box.

### Alignment & Visual Balance
Everything is left-aligned to the measure; nothing is centred. The hero runs
headline-and-body left with the portrait plate dropped into the right column, and
the method line closing the section on a full-measure rule. Section markers are
numbered `00`–`07` in mono so the page reads as a sequence.

### Responsive Behavior & Touch
- Mobile-first. The rail only appears at ≥1024px; below that the dock is fixed to
  the bottom with safe-area padding and `main` reserves `calc(5.5rem + safe-area)`.
- Grids collapse to a single column; multi-column ledgers stack.
- Interactive targets are ≥44px on touch; the desktop rail items are 44px tall.
- `scroll-margin-top` clears the dock on mobile (7rem) and the rail on desktop (2rem).
- No horizontal scroll at 360 / 390 / 768 / 1024 / 1440 / 1920px.

## 6. Design System Notes for Stitch Generation

### Language to Use
Editorial, set like a printed feature. "Numbered section marker on a hairline",
"ledger with the value set large and the label in mono", "full-bleed deep navy
room", "sunken tonal band", "floating liquid-glass rail, vertically centred".
Avoid: cards with equal drop shadows, centred heroes, gradient blobs, glass on
everything, oversized rounded rectangles.

### Color References
- Light paper `#e6e9ee`, sunken band `#dbe0e7`, white plate `#ffffff`.
- Deep navy room `#021f3f`, near-black `#00050a`.
- Vivid teal `#36ecdf` — dark surfaces only.
- Teal ink `#0a6560` — light surfaces only.
- Text: `#2f2f2f` primary, `#4a5056` supporting, `#e6e9ee` / `#969ea5` on dark.

### Component Prompts
1. "Editorial section opener: a mono index number and uppercase label sitting on a
   1px hairline rule that runs the full measure, a large left-aligned heading with
   its second line in muted grey, and a short supporting paragraph in the right
   column."
2. "Full-bleed dark navy feature block: large square creative plate on the left,
   and on the right an eyebrow, a white headline, a hairline ledger of
   label/value pairs with large values, a small outlined 'Reported figures' tag,
   and a teal-bordered methodology note."
3. "Floating liquid-glass vertical navigation rail, 176px wide, vertically centred
   24px from the left edge, 82% white fill with heavy backdrop blur, a specular
   highlight along its top edge, 44px rows each with a teal index numeral on the
   right and an active row shown by a filled surface plus a teal leading bar."

### Incremental Iteration
Change one dimension at a time: surface tone first, then measure, then type scale,
then figure placement. Never solve a composition problem by adding glass, gradients
or motion.