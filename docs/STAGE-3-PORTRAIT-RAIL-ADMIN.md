# Stage 3 — Portrait, Collapsible Rail & Admin Console

**Project:** K-Nyi Portfolio (`knyi-portfolio`)
**Stage:** Functional. A real portrait, a collapsible navigation rail, and a private
console that writes the Work section.
**Status:** Active

---

## 1. The portrait

`public/Khantnyiprofilepct.jpg` (1536×1536) was already in the repository as an
untracked file — the full-resolution original of the same photograph that appears in
`~/Downloads/Khant_Nyi_Nyi_CV_With_Photo.pdf`. It is now the site's portrait.

| | |
|---|---|
| Source | `public/Khantnyiprofilepct.jpg` — 1536×1536, 298 KB |
| Shipped | `public/images/portrait-k-nyi.jpg` — 4:5 crop, 1000×1250, 157 KB, progressive JPEG |
| Used by | `HeroSection` via `next/image` with `fill`, `priority`, and `sizes` |

The crop takes the full height and trims 10% from each side, which keeps the subject
slightly right of centre with the head in the upper third. The frame reserves the 4:5
ratio before the image decodes, so there is no layout shift.

`src/components/visuals/PortraitPlate.tsx` — the typographic stand-in that stood in
while no photograph existed — has been deleted. There is no longer a placeholder.

---

## 2. Collapsible navigation rail

The rail is still a floating vertical glass panel, vertically centred and inset from
the left edge. It now collapses to an icon column.

| | Expanded | Collapsed |
|---|---|---|
| Rail width | 11rem | 3.25rem |
| Reserved band (`--rail`) | 12.5rem | 5rem |
| Content gutter | `calc(--rail + 3rem)` = 248px | 128px |
| Labels | visible | visually hidden, still in the accessibility tree |
| Footer (location, availability) | visible | hidden |

**Collapsing is a layout change, not just a paint change.** `--rail` is published on
`<html data-rail>` by `SiteNavigation`, and `.shell` reads it, so the content measure
genuinely widens by 120px and the grid re-wraps. Verified: the hero portrait grows and
the lede line lengthens when the rail collapses.

The state persists in `localStorage` under `knyi-rail-state`, read through
`useSyncExternalStore` rather than an effect — React uses the server snapshot during
hydration, so the markup matches on first paint and the stored preference is applied
immediately afterwards.

Accessibility: the toggle is a `<button>` with `aria-expanded` and a label that changes
between "Collapse navigation" and "Expand navigation". Labels of collapsed links are
kept in the accessibility tree, so a screen reader still announces "About", not nothing.
Active state is still signalled three ways (filled surface, teal bar, teal icon) plus
`aria-current`.

**The index numerals (00–07) were removed from the sidebar** at the owner's request.
They were a typographic device, not information.

### Responsive behaviour when collapsed

| Viewport | Expanded gutter | Collapsed gutter |
|---|---|---|
| 1024px | 248px | 128px |
| 1440px | 248px | 128px |
| 1920px | 248px | 128px |

Below 1024px the rail is not rendered at all and the mobile dock is used, so the
collapsed state has no effect on phones.

---

## 3. Admin console

`/admin` — a private console for the case studies behind the Work section. Same
Liquid Editorial language as the public site: the same tokens, the same type scale,
the same hairline ledger rows, the same teal accents. Laid out as a working tool
rather than a composition — a fixed header instead of a floating rail, and no
atmosphere layer.

### Route structure

The public chrome was moved into a `(site)` route group so the console does not
inherit it. Before this, `/admin` rendered the public navigation rail and the public
`<main>` shell — caught in review and fixed.

```
src/app/
  layout.tsx              root: fonts, metadata, skip link
  (site)/layout.tsx       public chrome: atmosphere, rail, main
  (site)/page.tsx         the public page
  admin/layout.tsx        admin shell
  admin/page.tsx          server component: checks the session cookie
  api/uploads/[name]/     serves uploaded images
  api/content/case-studies/
    route.ts              GET / POST / PUT / DELETE
    upload/route.ts       POST multipart
```

### What it does

- **Sign in** with `ADMIN_PASSWORD`. The session cookie is checked on the server
  before anything renders, so an unauthenticated visitor never receives the dashboard
  markup or the case-study data in the HTML payload.
- **Create, edit, delete** case studies — every field in `content/case-studies.json`.
- **Upload a campaign image** (JPG, PNG, WebP, AVIF, up to 6 MB) with an optional alt
  text. The image appears in the public Work section in place of the editorial plate.
- **Reorder** studies — the first one is the featured case study; the rest alternate
  between the two supporting layouts.
- Every change is written to `content/case-studies.json` and the public page is
  regenerated.

### Honesty constraints kept in the editor

- A blank optional figure produces **no row** on the public page. The server stores
  blanks as `null`; there is no default to fall back on.
- "Independently verified" is a separate, unchecked-by-default toggle, and the editor
  says so.
- The methodology note is pre-filled with the standard wording but is editable.

### Three problems found and fixed during the build

1. **`next start` does not serve files added to `public/` after the build.** A freshly
   uploaded PNG 404s from `/uploads/<name>` — the build snapshot is what is served.
   Uploads are therefore written to `public/uploads/` but served from
   **`/api/uploads/<name>`**, a route handler that always reads from disk. This is
   the reason the stored path is `/api/uploads/...` and not `/uploads/...`.
2. **`revalidatePath("/")` did nothing.** A route with no `revalidate` export is a
   one-shot static artefact, and invalidating it did not regenerate the HTML. The
   page now declares `export const revalidate = 3600`, which makes it an ISR route —
   the build output shows `○ / 1h` — and `revalidatePath` regenerates it. Verified: a
   case study created in the console appears on the public page on the next request.
3. **The public Work section only rendered three studies.** A fourth was invisible, so
   adding one through the console appeared to do nothing. The section now renders the
   featured study plus every supporting study, alternating between the wide-row and
   offset-card layouts, so no two supporting studies look alike.

### Auth hardening

The original session cookie was the literal string `"authenticated"` — forgeable by
hand. It was harmless while the content routes were unused; with a console that
writes files it is not. The cookie value is now an HMAC keyed by the admin password,
compared in constant time, and **production refuses to run without `ADMIN_PASSWORD`**
rather than falling back to a hardcoded default. Mutating routes also check the
request origin, and every field is whitelisted and length-capped on the server.

`ADMIN_PASSWORD` is still the password — set it in `.env.local` and the flow is
unchanged.

### Storage trade-off

Uploads are files on disk. This needs a **writable** filesystem, which a VPS or
`next start` has and a read-only serverless filesystem does not. When this site
moves to Cloudflare Workers/D1, only `src/lib/uploads.ts` and the two upload routes
need to change; the JSON contract and every component stay the same.

---

## 4. Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | clean; `/` prerendered with a 1h ISR window, `/admin` dynamic |
| Unauthenticated `/admin` | sign-in form; no case-study data in the HTML payload |
| Wrong password | "Invalid password", 401 |
| Sign in | console renders with the three seed studies |
| Upload | file written, 200 + `image/png` from `/api/uploads/<name>` |
| Create | "Case study created — the public page has been updated" |
| **New study on the public page** | **yes, on the next request** |
| Reorder | "Order saved", order persisted |
| Delete | entry removed, uploaded image removed, public page updated |
| Sign out | back to the sign-in form |
| Public page | no horizontal overflow at 360 / 390 / 768 / 1024 / 1440 / 1920 |
| Console errors | none (the only 401 is the deliberate wrong-password test) |

The admin flow was driven end to end with Playwright against the production build,
creating, reordering and deleting a real entry, and the public page was checked after
each step. The seed data in `content/case-studies.json` was restored from git
afterwards and is byte-identical to its original state.
