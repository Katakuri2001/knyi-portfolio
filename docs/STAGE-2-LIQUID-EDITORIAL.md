# Liquid Editorial — Frontend Visual Redesign Plan

**Scope:** frontend art direction only. No new runtime deps, no framework change, no new
routes, no auth changes. Existing API routes and `content/*.json` untouched.

## Baseline findings (verified, not assumed)

- Next 16.4.0 / React 19.3 / Tailwind v4 (`@theme`, no `tailwind.config.ts` in effect).
- `npm run build`, `npx tsc --noEmit`, `npm run lint` all clean before changes.
- `npm run dev` still crashes on this CPU (SIGBUS on SWC); production build + `next start` works.
- Playwright 1.64 + cached Chromium available → real screenshot verification possible.
- **Google Stitch MCP is installed but not authenticated** (`list_projects` → HTTP 401
  "API keys are not supported"). Stitch could not be used. `.stitch/DESIGN.md` (already in repo)
  is used as the standing design-system reference.
- **No usable imagery in the repo.** `public/` contains only the five default Next.js SVGs.
  There is no portrait and no campaign photography.

## Problems found in the current build

1. **Dark "rooms" are not full-bleed.** `main` carries `lg:pl-[13.5rem]`, so the contact/footer
   dark band stops 13.5rem short of the left edge and leaves a light grey stripe behind the rail.
2. **Every section is the same weight.** Ten sections, one eyebrow + one `text-title` + one right
   column paragraph. No tonal rhythm, no editorial spine.
3. **Too much glass.** Six surfaces use glassmorphism (rail, hero portrait, about blockquote,
   expertise card, tools card, five contact cards). Glass stops reading as "liquid" when everything
   is glass.
4. **Case studies are three near-identical blocks.** Featured is dark; the two supporting studies
   are the same glass card in a 2-up grid. The paratha `averageOrderValue: "US$3"` in
   `case-studies.json` is never rendered.
5. **Data duplication / drift.** Every section hardcodes strings that also live in `content/*.json`.
   That is the root cause of the documented JSON↔JSX mismatch.
6. **Placeholder imagery** is a diagonal gradient + a ghosted index numeral — reads as broken.
7. **Atmosphere** is 5 stacked radial "blobs" with an infinite 52s drift animation: the exact
   "oversized gradient blobs / constant floating elements" the brief rules out.

## Decisions

### 1. Single source of truth for content
New `src/lib/content.ts` imports the five `content/*.json` files (server-side static import,
`resolveJsonModule` already enabled) and exposes typed accessors. All section components read from
it. This removes the hardcoded second copy of the data and makes the JSON authoritative at build
time. **The paratha average order value will now render, because the JSON says so** — the
documented mismatch is resolved by deferring to the authoritative data, not by inventing a reason.

### 2. Layout spine
- `--rail` token; `main` loses its left padding.
- `.shell` = the content column (max-width + gutters + rail offset).
- `.room-bleed` = full-bleed band that cancels the rail gutter, so dark and sunken bands run
  edge to edge while their content stays aligned to the same column.

### 3. Tonal rhythm (alternating surfaces, not alternating rounded cards)
| # | Section | Surface |
|---|---------|---------|
| — | Hero | light paper |
| 01 | About | light paper + faint teal wash |
| 02 | Expertise | full-bleed **sunken** band, hairline index |
| 03 | Selected Campaigns | full-bleed **dark room** (featured) → light (supporting) |
| 04 | Working Method | light paper + teal wash |
| 05 | Tools & Capabilities | full-bleed **sunken** band |
| 06 | Education | light paper |
| 07 | Contact + Footer | full-bleed **dark room** |

### 4. Case-study presentation modes (three distinct, not one grid)
- **Mode A — Featured** (`id: a`, dark room): 12-col split, large campaign-creative figure,
  scope line, hairline metric ledger, `Reported` tag, methodology footnote.
- **Mode B — Wide row** (`id: b`): horizontal split, reach-ramp figure left, ledger right.
- **Mode C — Offset editorial card** (`id: c`): narrower, pushed right of centre, oversized
  index numeral in the margin, audience-research figure.

All three read `content/case-studies.json`. Metrics are rendered only when the JSON supplies them.

### 5. Sidebar
Keep the floating vertical rail and its footprint. Refine the material: teal rim-light, specular
top highlight, softer depth, active state = filled pill **and** teal bar **and** `aria-current`
(not colour alone). Add a factual availability footer. Mobile dock keeps the 4-item pill + expand
sheet; active state gains a teal dot so it is not conveyed by background alone.

### 6. Imagery
No real assets exist and none can be honestly generated. Per the brief, build **local SVG figure
components** in `src/components/visuals/` — editorial, abstract, brand-palette line/plate work:
`PortraitPlate`, `CampaignCreativeFigure`, `ReachRampFigure`, `AudienceResearchFigure`,
`SearchPerformanceFigure`. All `aria-hidden`, all free of numbers, labels, axis ticks or
dashboard-like data so nothing can be mistaken for evidence. Inline SVG = zero requests, zero CLS,
crisp at any size, no hotlinking. Each carries a code comment naming the exact file to drop in when
real photography arrives.

### 7. Motion
Keep the existing `Reveal` (IntersectionObserver, progressive enhancement, already verified to
show everything with JS off and under reduced motion). Add only: figure scale-in on reveal and
link/button hovers. **Delete** the infinite `atmosphere-drift` animation.

### 8. Atmosphere
Replace 5 drifting blobs with: fine paper grain (inline `feTurbulence`, no request), one static
wide teal wash anchored behind the hero, and a top light-falloff. Static — nothing moves.

## Content drift — resolved

`case-studies.json` records `averageOrderValue: "US$3"` for the paratha business and the
old JSX never rendered it. Rather than invent a reason for the gap, the second copy of the
data was deleted: `caseStudies` now flows straight from JSON into `caseMetrics()`, and
`US$3` appears on the page because the record supplies it. The other direction is enforced
too — `adSpend: null` on the underwear case study produces no "Ad spend" row rather than a
placeholder.

`contact-leads.json` still holds one row with every field empty. It is not real data and
was not seeded. The public site does not read it.

## Verification results

Run against the production build (`npm run build && npm run start`) with Playwright 1.64
and the cached Chromium. No new runtime dependency was added — Playwright was already a
devDependency.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | clean, all routes emitted, `/` prerendered static |
| Console errors / failed requests | 0 at every viewport |
| Horizontal overflow | none at 360 / 390 / 768 / 1024 / 1440 / 1920 |
| WCAG AA contrast | 0 failures across ~250 rendered text samples at 360 / 768 / 1440 |
| Reduced motion | nothing hidden |
| JavaScript disabled | nothing hidden |
| Anchor navigation | all 7 rail anchors land 32px from the top; active item matches |
| Mobile menu | opens, `aria-expanded` toggles, Escape closes and restores focus |
| Touch targets | 69×51 px on the mobile dock; 44 px rows in the rail |
| Focus rings | 2px teal on every interactive element in the tab order |

One contrast regression was found and fixed during this stage: `--color-accent-ink` was
`rgb(13,116,110)`, which clears AA on paper (4.9:1) but only reached 4.23:1 on the sunken
band introduced here. It was darkened to `rgb(10,101,96)` — 5.2:1 on sunken, 5.5:1 on paper.

`npm run dev` was re-tested and still crashes on this CPU with the SWC `SIGBUS` recorded in
Stage 1. It is an environment constraint, not a code defect; the documented
`npm run build && npm run start` workflow was used throughout.

## Validation gate
`npx tsc --noEmit`, `npm run lint`, `npm run build`, then Playwright screenshots at 360 / 390 /
768 / 1024 / 1440 / 1920 plus reduced-motion and JS-disabled passes, with a horizontal-overflow
and console-error probe at each size.