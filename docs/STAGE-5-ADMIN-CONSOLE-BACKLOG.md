# Stage 5 — Admin Console: Audit and Backlog

**Project:** K-Nyi Portfolio (`knyi-portfolio`)
**Status:** Audit complete. Nothing implemented yet — this document is the
findings and the proposed order of work.
**Supersedes nothing.** Builds on Stage 3 (the console was built there) and
Stage 4 (the deployment).

---

## 1. What the console is today

The route chain is short and completely linear:

```
/admin
  └─ src/app/admin/page.tsx        server component — reads the session cookie
       └─ src/components/admin/AdminShell.tsx        client — signed-in gate
            └─ src/components/admin/CaseStudyManager.tsx   client — the only panel
                 └─ src/components/admin/CaseStudyEditor.tsx  client — the form
```

`AdminShell` takes a single `caseStudies` prop and renders a single panel. There
is no tab bar, no section nav, and no link to anything else. The header subtitle
is the literal string `"Selected campaigns"`.

**Case studies are complete.** Create, edit, delete, reorder, upload a campaign
image with alt text, edit the methodology note, and toggle reported / verified.

**Everything else is missing.** That is the whole gap.

---

## 2. Six content routes, one wired up

| Route | Methods | Wired to the UI? | Auth check | Revalidates? | DELETE? |
|---|---|---|---|---|---|
| `/api/content/case-studies` | GET POST PUT DELETE | **yes** | `hasValidSession` ✓ | yes ✓ | yes ✓ |
| `/api/content/profile` | GET POST PUT | no | legacy ✗ | no ✗ | no ✗ |
| `/api/content/services` | GET POST PUT | no | legacy ✗ | no ✗ | no ✗ |
| `/api/content/tools` | GET POST PUT | no | legacy ✗ | no ✗ | no ✗ |
| `/api/content/education` | GET POST PUT | no | legacy ✗ | no ✗ | no ✗ |
| `/api/content/contact-leads` | GET POST PUT | no | legacy ✗ | no ✗ | no ✗ |

"legacy" is the pre-redesign check, `cookie.value === "authenticated"`. Stage 3
replaced it with an HMAC-signed token on the auth route and the case-studies
route only. The other five were never updated.

---

## 3. Findings

### 3.1 The five unused routes are broken in both directions — **highest severity**

They were not merely unused. Measured against a live server with the real
session cookie and against a hand-written `admin_session=authenticated`:

| Route | Legitimate session | Forged literal cookie |
|---|---|---|
| `case-studies` | **200** ✓ | **401** ✓ |
| `profile` | **401** ✗ | **200** ✗ |
| `services` | **401** ✗ | **200** ✗ |
| `tools` | **401** ✗ | **200** ✗ |
| `education` | **401** ✗ | **200** ✗ |
| `contact-leads` | **401** ✗ | **200** ✗ |

Two distinct faults:

1. **A real login is rejected.** The new auth route issues an HMAC token; these
   routes still compare against the literal string `"authenticated"`. Nobody who
   signs in correctly can use them.
2. **A forged cookie is accepted.** Anyone who types
   `admin_session=authenticated` into devtools passes the check.

This is academic while the routes are unreachable from the public site, but it
becomes a live vulnerability the moment a console panel uses them. **Fix the auth
before building any UI on top.**

### 3.2 Four of the five routes cannot write

`profile.json`, `services.json`, `tools.json` and `education.json` are each a
single **object**. Their POST and PUT handlers all do:

```ts
const updated = [...existing, item];   // existing is an object → throws
```

Spreading a non-iterable throws, the handler catches it, and the request
returns **500 "Failed to create"**. The writes are unreachable, not just
untested.

`contact-leads.json` is an **array**, so the same line is correct for it.

This is the same defect recorded as §3.5 in the original Cloudflare spec. It
was never fixed because no UI exercised these routes.

### 3.3 No write invalidates the public page

Only the case-studies route calls `revalidatePath("/")`. The other five write
the JSON and return. The public page is statically prerendered with a one-hour
ISR window, so **an edit made through them would not appear on the site for up
to an hour** — or, on GitHub Pages, until the next deploy.

### 3.4 No validation, and client ids are trusted

`case-studies` has `sanitiseCaseStudy()`: a whitelist of fields, trimmed and
capped strings, nullable optional figures, and server-generated ids. The other
five write `body` straight into the JSON file. Anything a client sends is
stored, including unexpected keys.

### 3.5 No origin check on writes

`case-studies` calls `isSameOrigin(request)` on POST/PUT/DELETE. The other five
do not. `SameSite=Strict` on the cookie covers most of it, but the
case-studies route does not rely on that alone.

### 3.6 The Expertise section is only half data-driven

`services.json` supplies the three discipline **descriptions**, but the twelve
**capability names** are hard-coded in `EXPERTISE_GROUPS` in `src/lib/content.ts`.
A console that edits `services.json` would change the prose under each heading
and not the items under it. Making Services genuinely editable therefore
requires making the section data-driven first — it is a refactor, not a form.

### 3.7 Contact leads has no source

The public site has **no contact form**. `contact-leads.json` holds one row
with every field empty, and the admin API can create leads but nothing does.
A leads inbox today would be a queue that can only be filled by hand.

---

## 4. What is missing from the console

Ranked by value, with the reasoning.

### 4.1 Profile and contact details — do this first

`content/profile.json` drives the hero name and tagline, the About section, and
the whole Contact section. Its contact values are **placeholders and they are
live on the published site right now**:

| Field | Current value | Shown on the site |
|---|---|---|
| `contact.email` | `info@knyi-portfolio.local` | yes — the primary contact action |
| `contact.telegram` | `@knyi-portfolio` | yes — the channel ledger |
| `contact.website` | `http://localhost:3000` | yes — in the JSON, and it points at localhost |
| `contact.phone` | `+95 997 3949 109` | yes — the channel ledger |
| `location` | `Yangon, Myanmar` | yes — hero ledger, contact, footer |
| `remoteAvailability` | `Remote / Work From Home` | yes — hero, contact, footer |

The other fields — `name`, `professionalName`, `tagline`, `positioning`,
`background`, `howITick`, `whatIVALUE` — all appear on the public page too.

This is the only item that repairs data that is **currently wrong on the live
site**. Everything else is missing-but-not-wrong.

Shape: a single object, so the editor is a form with one set of fields, not a
list. It needs a **PUT-only** API (no POST — a profile is one row, not a
collection) and it must write the object, not append to it.

### 4.2 Tools — simple, low risk

`content/tools.json` is two arrays of strings: `practicalExposure` (7) and
`currentlyLearning` (5). The public Tools section renders both as separate
ledgers, with the learning list indented and marked with hollow rings so the
distinction survives greyscale.

The editor is two add/remove/reorder lists. `tools.json` is an object, so the
route needs the same object-aware write as Profile, and it needs a way to
reorder within a list.

### 4.3 Education — simple, low risk

`content/education.json` is `{ completed[], currentlyStudying[], university }`.
- `completed` — `{ name, institution, year }` (year is a number)
- `currentlyStudying` — `{ name, institution }` (no year)
- `university` — `{ status }` — the string *"Second-year university studies,
  discontinued before graduation"*, rendered verbatim in a `Status` note.

The public section renders ongoing entries first with a hollow node and the word
"Ongoing", then completed ones newest-first with a filled node and the year.

The editor needs three sub-forms: two repeatable entry lists and one single
text field for the university status.

### 4.4 Services — the awkward one

Needs the §3.6 refactor first (move `EXPERTISE_GROUPS` capability names into
`services.json`), and then an editor for three named groups, each with a title,
a description, and a list of capabilities. The group *keys* (`metaAds`,
`contentStrategy`, `marketingAnalysis`) are also the lookup keys used by
`EXPERTISE_GROUPS` — they must stay stable, or the section needs a migration.

### 4.5 Contact leads — lowest priority

The status workflow is `new → contacted → closed`. The public site does not
capture leads, so the practical sequence is:

1. decide whether a public contact form is wanted at all;
2. if yes, build it (a form on the public page, posting to
   `/api/content/contact-leads`);
3. only then build the inbox.

Building the inbox before the form gives a queue that can only be filled by
hand. If a form is wanted, it should probably be considered before the SEO
lockup, because a contact form is a conversion path and the lockup is a brand
mark.

### 4.6 Ordering

Case studies can be reordered — the first one is the featured study, the rest
alternate between the wide-row and offset-card layouts. `services.json`,
`tools.json` and `education.json` have no order concept at all, so the sections
that render them have a fixed sequence. If the order matters to the owner, it
needs an `order` field on each, exactly as `case-studies` has.

### 4.7 Console navigation

Adding more panels needs a decision about shape:

- **Client-side tabs** — `AdminShell` keeps one server fetch and swaps panels.
  The header nav becomes a tab row. Least code, no new routes.
- **Sub-routes** — `/admin`, `/admin/profile`, `/admin/tools`, … each a server
  component that reads the cookie and fetches its own data. More routes, but
  each panel is directly linkable and refreshes on its own, and it matches how
  the public site is already structured.

The public site is a single page with anchor navigation; the console is an app
with sections. Sub-routes are the better fit, and they let the console grow
without rewriting `AdminShell` each time.

### 4.8 Also worth adding

- **A "view on site" link per entry** — after editing a case study, a link that
  jumps to its position in the public Work section.
- **A publish indicator** — the console writes the JSON immediately, but the
  public page only changes on redeploy (GitHub Pages) or on ISR revalidation
  (a Node host). The console should say which of the two is in effect, or the
  owner will think a save did nothing.
- **Unified save feedback** — the case-study manager reports
  "the public page has been updated". On GitHub Pages that statement is
  currently inaccurate; it should say "saved — run `npm run deploy:pages` to
  publish".

---

## 5. Prerequisites — do these before any new panel

The five routes need to be brought up to the case-studies standard. This is
independent work and it is worth doing as its own step.

| # | Task | Why |
|---|---|---|
| A | Replace `checkAuth` with `hasValidSession` on all five routes | closes the forged-cookie hole and makes real logins work |
| B | Add `isSameOrigin` to all writes | matches the case-studies route |
| C | Make each route shape-aware — object vs array | four of five currently 500 on write |
| D | Add per-type validation, mirroring `sanitiseCaseStudy` | nothing should be written straight from the request body |
| E | Add `revalidatePath("/")` to every write | so an edit is not invisible for an hour |
| F | Add `DELETE` where the content type is a list | tools, education, services, leads are all lists |
| G | Decide the public-page update model | `revalidatePath` on a Node host; an explicit deploy on Pages |

**G is the one to decide first**, because it changes what the console can tell
the owner. On GitHub Pages there is no server, so an edit in the JSON is not
live until `npm run deploy:pages` runs. On a Node host the ISR window makes it
live within the hour. The console should reflect whichever is in force.

---

## 6. Open decisions for the owner

### 6.1 Where the full SEO lockup goes

`Khant Nyi Nyi SEO Logo.png` is a white-on-transparent lockup. Composited onto
the three surfaces in the palette:

| Surface | Result |
|---|---|
| deep navy `#021f3f` | **perfect** — wordmark, sub-line and tagline all read |
| paper `#e6e9ee` | wordmark is white-on-light-grey, effectively invisible |
| white | invisible |

**Recommendation:** the Contact + Footer dark room. It is the page's closing
statement, the room is already navy, and the footer's small type leaves room for
a lockup without competing with the email CTA. The lockup's background is
transparent, so it dissolves into the room.

**Also** use it as the `og:image` — it is a designed share card, and that is
how the site will appear on LinkedIn and X. A 1200×630 crop of the lockup is
the share-card proportion.

A WebP derivative is prepared at `public/images/brand-lockup.webp` (102 KB,
against 1.9 MB for the PNG).

### 6.2 The positioning conflict

The lockup and the site say two different things:

| | Says |
|---|---|
| `Khant Nyi Nyi SEO Logo.png` | **SEO & MARKETING** — *"Better Visibility · More Traffic · Real Growth"* |
| The site | **INDEPENDENT PERFORMANCE MARKETER** — *"Diagnose First. Strategize Better. Optimize for Growth."* |

Both cannot be the headline. The lockup is the owner's own brand, so it likely
wins on the lockup side — but then the hero eyebrow and the About section need
to be reconciled with it, or the site reads as two brands. This is also a
Profile edit (§4.1), so it can be settled in one pass.

### 6.3 `ADMIN_PASSWORD`

Still the default `knyi-admin-2026`, which is what has been used for testing.
Set it in `.env.local` and restart. Production refuses to start without it.

### 6.4 The console is not on GitHub Pages

`/admin` and `/api/*` return 404 on the deployed site — a static export has no
server. The console is a **local tool**: edit, commit, push, deploy.

---

## 7. Proposed order of work

| Step | What | Depends on |
|---|---|---|
| 1 | Prerequisites A–F (§5) | — |
| 2 | Console navigation (§4.7) — pick tabs or sub-routes | — |
| 3 | Profile editor (§4.1) + the contact details | 1, 2 |
| 4 | Tools editor (§4.2) | 1, 2 |
| 5 | Education editor (§4.3) | 1, 2 |
| 6 | Services (§4.4) — refactor `EXPERTISE_GROUPS` to data, then the editor | 1, 2 |
| 7 | Ordering for the list types (§4.6) | 4, 5, 6 |
| 8 | Contact form, then the leads inbox (§4.5) | 1, 2, and decision G |
| 9 | The lockup placement and the positioning reconciliation (§6.1, §6.2) | 3 |

Steps 3, 4 and 5 are independent of each other and can be done in any order
once 1 and 2 are in place.

---

## 8. How the findings were established

Read-only inspection plus a live measurement against the production build:

- the route chain was traced from `/admin` down to the editor component;
- every content route was read for its methods, auth check, write path and
  revalidation call;
- `src/components/**` was grepped for callers of each content route — only
  `case-studies` has one;
- the auth behaviour was **measured**, not assumed: a real session cookie and a
  hand-written `admin_session=authenticated` were sent to all six routes and the
  status codes recorded;
- the shape bug was confirmed by reading the file layouts — four content files
  are objects and one is an array;
- the deployed site was checked for `/admin` and `/api/*` (both 404).

No code was changed to produce this document.
