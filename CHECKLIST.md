# K-Nyi Portfolio — Inspection Checklist

Two surfaces, one repository.

| Surface | What it is | Where it runs |
|---|---|---|
| **Public portfolio** | The marketing site — hero, about, expertise, work, method, tools, education, contact | `https://katakuri2001.github.io/knyi-portfolio/` (static, GitHub Pages) and `http://localhost:3000` |
| **Admin console** | The marketing intelligence console — 11 sections | `http://localhost:3000/admin` (needs a server) |

**Legend** — ✅ verified and working · ⚠️ built, needs credentials or a host · ⬜ not built

> **How to read this.** Every item says *what to check* and *how to check it*.
> The commands assume the production build, because `npm run dev` crashes on this
> machine (SWC `SIGBUS` — an environment limit, not a defect):
>
> ```bash
> npm run build && npm run start
> ```

---

## 0. The commands

```bash
npx tsc --noEmit        # types            → expect 0 errors
npm run lint            # eslint          → expect 0 errors, 0 warnings
npm test                # 62 unit tests   → expect 62 pass, 0 fail
npm run build           # production build→ expect clean
npm run build:pages     # static export   → expect clean, must not touch .next
npm run migrate         # create/upgrade the database
npm run prune           # apply the 180-day retention policy (cron)
```

---

## 1. Public portfolio

### 1.1 Content — ✅

- [x] Hero shows the real name, tagline, positioning line, portrait, two CTAs
- [x] Portrait is `public/images/portrait-k-nyi.jpg` — a 4:5 crop of the 1536×1536 original
- [x] About states the background accurately — 2023–2026 freelance, no inflated titles
- [x] Expertise groups the 12 documented capabilities into 4 groups, no invented skills
- [x] Work section renders **any** number of case studies, alternating layouts
- [x] Method section shows the 4 stages that exist: Diagnose → Strategize → Plan → Optimize
- [x] Tools and Education match `content/*.json` exactly
- [x] Contact shows the **real** contact details
- [x] University status rendered verbatim, not softened
- [ ] ⚠️ Contact details are still placeholders — `info@knyi-portfolio.local`, `@knyi-portfolio`, `http://localhost:3000`. Edit them in **Console → Settings**

### 1.2 Honesty rules — ✅

- [x] Every figure comes from `content/case-studies.json` — nothing is hardcoded in a component
- [x] A blank optional figure renders **no row**; the site never fills one in
- [x] `reported` and `verified` stay separate; verified is off by default
- [x] The methodology note appears on every study
- [x] No invented clients, testimonials, certifications, ROAS, revenue or conversion rates
- [x] No seeded demo leads — `data/knyi.db` starts empty
- [x] The technical audit reports only what it can actually detect

### 1.3 Lead capture — ✅

- [x] Contact form posts to `POST /api/leads`
- [x] Server-side validation: a contact method is required, the email shape is checked
- [x] Honeypot field rejects bots
- [x] Spam heuristic: a message that is only links is refused
- [x] Rate limited: 5 submissions per origin per hour
- [x] Duplicate submissions within 24h are refused, not stored twice
- [x] Success is only reported after the lead is actually stored
- [x] Attribution captured at submission: first-touch, last-touch, UTM set, landing path, referrer host
- [ ] ⚠️ No email notification — `RESEND_API_KEY` + `LEAD_NOTIFICATION_EMAIL` are not set

### 1.4 SEO — ✅

- [x] One `<h1>`; `h2` per section; `h3` beneath
- [x] Title ≤ 60 chars, meta description ≤ 160 chars — both checked by the audit
- [x] Canonical URL emitted when `NEXT_PUBLIC_SITE_URL` is set
- [x] Open Graph + Twitter card, with the portrait as the preview image
- [x] `robots.txt` generated, excluding `/admin` and `/api`
- [x] `sitemap.xml` generated from the public route list only
- [x] No private path can reach the sitemap — the route list is a fixed constant
- [x] `next/image` with real width/height; the frame reserves the space (no CLS)
- [x] Alt text on every meaningful image; decorative images use `alt=""`
- [x] `public/.nojekyll` so Jekyll does not strip `_next/`
- [ ] ⚠️ Search Console is not connected — `GOOGLE_SERVICE_ACCOUNT_JSON` + `SEARCH_CONSOLE_SITE_URL`

### 1.5 Accessibility — ✅

- [x] Skip link to `#main`, visible on focus
- [x] One `<h1>`, no skipped heading levels
- [x] Keyboard reachable: nav, filter tabs, every form control
- [x] Visible focus ring on everything, 2px teal
- [x] Labels bound to every input
- [x] `aria-live` status regions for save results and form feedback
- [x] Contrast: 0 WCAG AA failures, 748 text samples across all 11 console pages and the public site
- [x] `prefers-reduced-motion` honoured — the page renders fully with no movement
- [x] `prefers-reduced-transparency` honoured — the glass falls back to solid fills
- [x] Touch targets ≥ 44px on the mobile dock and in the console

### 1.6 Responsive — ✅

- [x] 360 / 390 / 768 / 1024 / 1440 / 1920 — no horizontal overflow anywhere
- [x] Mobile dock with an "All sections" sheet
- [x] The rail collapses to an icon column and the **content measure widens with it**
- [x] Tables scroll horizontally on small screens rather than being crushed

### 1.7 Privacy — ✅

- [x] Nothing is tracked before consent
- [x] Three consent levels: essential / analytics / marketing
- [x] A contact form is **not** treated as marketing consent
- [x] The choice is remembered for 30 days
- [x] No IP address stored, no device fingerprinting
- [x] A pseudonymous visitor id only; never derived from an email
- [x] 180-day retention, applied by `npm run prune`
- [x] PII never reaches an analytics table — a payload with a personal field is rejected outright

---

## 2. Admin console

### 2.1 Access — ✅

- [x] Sign in at `/admin` with `ADMIN_PASSWORD`
- [x] The session cookie is an HMAC keyed by the password, compared in constant time
- [x] The cookie's `Secure` flag follows the **request protocol**, so a local `npm start` over http works
- [x] Production refuses to start without `ADMIN_PASSWORD`
- [x] Every admin API checks the session server-side — 401 without it
- [x] Every write checks the request origin
- [x] Sign-out clears the cookie
- [x] The public site never exposes a lead
- [ ] ⚠️ `ADMIN_PASSWORD` is still the development default `knyi-admin-2026`

### 2.2 The eleven sections — ✅

- [x] **Overview** — 8 KPIs with previous-period comparison, suppressed when the sample is too small
- [x] **Analytics** — trends, channels, devices, event types, landing pages, case-study interest, live feed
- [x] **SEO intelligence** — the technical audit, Search Console, the metadata editor
- [x] **Acquisition & campaigns** — channels, landing pages, observed UTM campaigns, the campaign register, the attribution model
- [x] **Conversions & leads** — the pipeline, and the full lead manager
- [x] **Audience intelligence** — devices, service interest, content interest, remarketing audiences
- [x] **Content & case studies** — the case-study editor
- [x] **Experiments** — the hypothesis → change → metric → result log
- [x] **Integrations** — live status, setup instructions, a real "Test connection" button
- [x] **Reports** — period summaries and CSV export
- [x] **Settings** — the profile, the content inventory, the environment

### 2.3 Reporting integrity — ✅

- [x] One period selector, shared by every page, carried in the URL
- [x] All periods are computed in **UTC**, and the label says so
- [x] The previous period is the same length, immediately before
- [x] A comparison is suppressed below 30 samples, so no trend is implied from noise
- [x] Insights are direct comparisons of two measured numbers — no model, no inference
- [x] Every metric has one definition; the reports use the same code path as the dashboard
- [x] Missing data renders as "Not configured" or "Insufficient data" — never zero
- [x] Empty states explain what is missing and what to do about it

### 2.4 Lead management — ✅

- [x] Search, filter by status, filter by date
- [x] Status: new → contacted → qualified → proposal sent → won → lost → archived
- [x] The server sets `qualified_at` and `closed_at` — the client cannot forge them
- [x] An unknown status is rejected
- [x] Internal notes, follow-up date, deal value
- [x] Delete asks for confirmation
- [x] Leads are private: never in a public route, never in an analytics provider

### 2.5 SEO tooling — ✅

- [x] The technical audit checks the site's **own** pages
- [x] It accepts **no URL** — the destinations come from a constant in the repository, so it cannot be pointed at an internal address
- [x] Fetches are timeout-bounded and size-capped
- [x] Findings are error / warning / informational, each with an explanation and a fix
- [x] The metadata editor writes an override the public page actually renders
- [x] Removing an override restores the code defaults
- [x] Noindexing the whole site needs a second, explicit confirmation
- [ ] ⚠️ Search Console reporting — needs the service account

### 2.6 Reports and export — ✅

- [x] CSV export uses the same date range as the report
- [x] Correct columns, correct rows
- [x] Values starting with `=`, `+`, `-` or `@` are escaped, so a message body cannot become a spreadsheet formula
- [x] The message body is excluded unless explicitly requested
- [x] The export is behind the session check

### 2.7 Integrations — ✅ / ⚠️

- [x] Every integration shows a real status, never "connected" because a variable exists
- [x] "Test connection" calls the provider and reports what it says
- [x] Missing variables are named individually
- [x] No secret is ever sent to the browser or shown on the page
- [ ] ⚠️ GA4 reporting — needs `GA4_PROPERTY_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON`
- [ ] ⚠️ Search Console — needs `GOOGLE_SERVICE_ACCOUNT_JSON` + `SEARCH_CONSOLE_SITE_URL`
- [ ] ⚠️ GA4 collection — needs `NEXT_PUBLIC_GA_MEASURE_ID`
- [ ] ⚠️ Meta Pixel — needs `NEXT_PUBLIC_META_PIXEL_ID`
- [ ] ⚠️ Meta Ads — needs `META_AD_ACCOUNT_ID` + `META_ACCESS_TOKEN`
- [ ] ⚠️ Google Ads — needs `GOOGLE_ADS_CUSTOMER_ID` + `GOOGLE_ADS_DEVELOPER_TOKEN`
- [ ] ⚠️ Lead notifications — needs `RESEND_API_KEY` + `LEAD_NOTIFICATION_EMAIL`

### 2.8 Design — ✅

- [x] Same palette, same type scale, same hairlines as the public site
- [x] The navigation is a floating glass panel, inset, with a rounded edge
- [x] The filter bar is a glass trough; the active tab is a navy glass chip
- [x] Primary actions are deep navy glass with a teal keyline
- [x] Secondary controls and form fields are light glass with a specular edge and **no** backdrop filter — there are dozens per page and a filter on each is real frame cost
- [x] KPI tiles and panels are glass cards: a 10px blur and a high fill, so the numbers stay crisp
- [x] The state is carried by shape and contrast as well as by colour
- [x] The console stays a tool, not a landing page: no gradients on panels, no oversized KPIs, no decorative charts
- [x] Contrast re-verified after every material change: 0 failures, 748 samples

### 2.9 Storage — ✅

- [x] One storage port, two adapters: `better-sqlite3` on a Node host, D1 on Cloudflare Workers. The same queries run in both
- [x] 15 tables, applied by repeatable migrations that run on either backend
- [x] `import "server-only"` on every database module, so a client component cannot pull it into the browser
- [x] The reviewed portfolio copy is in the content store; `content/*.json` is the seed
- [x] Indexes on every queried column
- [x] Retention: events expire after 180 days

---

## 3. Deployment

### 3.1 GitHub Pages — the public portfolio

- [x] Public portfolio live on GitHub Pages, published from the `gh-pages` branch
- [x] `npm run deploy:pages` builds the export **in isolation** — it cannot overwrite the server build
- [x] `/admin` and `/api/*` are excluded from the export, by design
- [ ] ⚠️ The automatic Pages deploy is blocked by a **billing lock on the GitHub account** — every workflow fails with "The job was not started because your account is locked due to a billing issue". Clear it, then switch Settings → Pages → Source to "GitHub Actions"
- [ ] ⚠️ A custom domain: set `NEXT_PUBLIC_BASE_PATH` to an empty string in the workflow and in `scripts/deploy-pages.mjs`

### 3.2 Cloudflare Workers — the whole application

- [x] The OpenNext Worker builds: `npm run build:cloudflare`
- [x] The Worker runs locally against a local D1 and R2: `npx wrangler dev`
- [x] The full end-to-end pass is green **on the Worker**: consent → tracking → contact form → stored lead → console → status update → SEO audit → case-study write-through to the public page → CSV export → unauthenticated rejection → mobile. Zero console errors
- [x] D1 holds the schema, the leads, the events and the content store
- [x] R2 holds the uploads; the public URL is unchanged
- [x] `revalidatePath("/")` purges the R2 incremental cache and the D1 tag cache, so a console edit reaches the public page
- [x] The origin check, the cookie's `Secure` flag and the SEO audit's target all read the **public** host, not the internal one
- [ ] ⚠️ **The Cloudflare resources have to be created once**: two D1 databases, two R2 buckets, then the ids into `wrangler.jsonc`. `docs/STAGE-7-CLOUDFLARE-WORKERS.md` has the exact commands
- [ ] ⚠️ The secrets have to be set with `wrangler secret put <NAME>` — they are not read from a `.env` file on Workers
- [ ] ⚠️ `NEXT_PUBLIC_SITE_URL` must be set in the `vars` block **and rebuilt** — `NEXT_PUBLIC_*` is inlined during the build, not read at runtime
- [ ] ⚠️ The domain: two CNAME records to the Worker, then a rebuild

---

## 4. Known limitations

- [ ] No A/B testing engine. The experiment log is manual, and the console never declares a winner from it — with no control group there is nothing to compare against
- [ ] No cost per lead or ROAS. No advertising spend data is connected, so they would be fabricated
- [ ] No visitor identity. A pseudonymous id, never a person
- [ ] The static export cannot apply SEO metadata overrides — there is no database on Pages
- [ ] Uploads need a writable filesystem on a Node host. On Workers they go to R2 instead
- [ ] The first-party tracker is not a GA4 replacement. It is a cross-check, and the two are reported separately
- [ ] The SEO audit checks the instance that is running, not the live site, unless `SITE_INTERNAL_URL` is set
- [ ] The static export is built from a checkout, so it carries the **seed** content. Console edits reach it only through Settings → Content export

---

## 5. Owner actions, in order

1. Set `ADMIN_PASSWORD` — production refuses to start without it
2. Set `NEXT_PUBLIC_SITE_URL` at build time
3. Replace the placeholder contact details — **Console → Settings**, then export the content to keep the repository in step
4. Add `GOOGLE_SERVICE_ACCOUNT_JSON` to unlock GA4 reporting and Search Console
5. Add `NEXT_PUBLIC_GA_MEASURE_ID` to unlock GA4 collection
6. Add `NEXT_PUBLIC_META_PIXEL_ID` to unlock remarketing audiences
7. Verify the Search Console property
8. Create the Cloudflare resources and deploy the Worker — `docs/STAGE-7-CLOUDFLARE-WORKERS.md` has the commands, in order
9. Clear the GitHub billing lock to re-enable the automatic Pages deploy
10. Decide where the full SEO lockup goes, and reconcile "SEO & Marketing" with the site's "performance marketer" positioning

---

## 6. How this file was built

Every ✅ above was verified by running the code, not by reading it. The
end-to-end pass drives the production build with a real browser: consent →
tracking → contact form → stored lead with attribution → console → status
update → SEO audit → metadata write-through to the live public page → CSV
export → unauthenticated rejection → mobile. The contrast audit composites
every translucent surface over the paper behind it and measures the real
ratio, because the glass changes the effective background under every label.
