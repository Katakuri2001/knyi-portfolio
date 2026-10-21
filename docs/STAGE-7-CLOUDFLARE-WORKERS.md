# Stage 7 — Cloudflare Workers, D1 and R2

**Status:** the code is complete and verified locally. The deployment needs
your Cloudflare account: the resources have to be created once, and the
secrets have to be set. Nothing else is outstanding.

This document is the handover. It covers what changed, why, what you have to
do, and what is still open.

---

## 1. The short version

The console needs a server. GitHub Pages cannot run one, so the console, the
contact form and the analytics ingestion have nowhere to live.

**Cloudflare Workers gives the whole project one home:**

| | Before | After |
|---|---|---|
| Public portfolio | GitHub Pages | Cloudflare Worker (and Pages, if you keep it) |
| Admin console | nowhere | `knyimediabuyer.xyz/admin` |
| Contact form | nowhere | feeds the lead pipeline in D1 |
| Analytics | nowhere | first-party events in D1 |
| Database | SQLite on a disk | D1 (SQLite, over HTTP) |
| Uploaded images | `public/uploads/` on a disk | an R2 bucket |

**Your current GitHub Pages site keeps working.** Cloudflare is a second
deployment, not a replacement. Both URLs serve the public portfolio until you
decide to point the domain at one of them.

## 1a. Which branch is what

- **`main`** is the deployed state of the public site. It is left alone.
- **`feature/cloudflare-workers`** is the working branch. This stage lives
  there, and incoming changes land there too.

`npm run deploy:pages` publishes the **working tree** to the `gh-pages`
branch, and the commit it writes records the branch and commit it was built
from. Read that line to know which content went live. The Pages workflow
builds from `main`.

---

## 2. What changed in the code

### 2.1 One set of queries, two storage backends

The console has to run in two places, and the database is the awkward part:
SQLite on a disk is synchronous, D1 is SQLite reached over HTTP and is
asynchronous.

Rather than write every query twice, `src/lib/db/adapter.ts` defines a small
interface — `all`, `first`, `run`, `batch` — and two adapters implement it:

- **`createSqliteAdapter()`** — `better-sqlite3`, a file at `./data/knyi.db`.
  This is what runs locally and on a Node host.
- **`createD1Adapter()`** — the D1 binding, on Workers.

Every query in `src/lib/db/` is written against the interface and runs
unchanged in both places. `getDb()` picks the adapter: D1 when the binding
is present, the local file otherwise.

**The queries had to change shape once.** SQLite drivers disagree on named
parameters — `better-sqlite3` uses `@name`, D1 uses `:name` — so every query
now uses positional `?` parameters, which both understand. The whole data
layer became `async` as a result, and every caller gained an `await`.

### 2.2 The content moved into the database

The reviewed portfolio copy — profile, services, tools, education, case
studies — now lives in a `content_documents` table, one JSON document per
kind.

**Why:** the console has to write to it. On Workers there is no writable
filesystem, so a JSON file on disk is not an option.

**What that means for you:**

- The files in `content/` are the **seed**. They are bundled with the code
  and used whenever the store has no row for a kind, so a fresh deployment
  renders correctly before anything is seeded.
- The **store** is the live copy. The console edits it.
- `npm run seed` writes the seed into a store that is empty. It never
  overwrites what is already there.
- **Settings → Content export** downloads the live content as a file, so you
  can commit it and keep the repository in step with the site. This matters
  for the GitHub Pages export, which is built from a checkout.

### 2.3 Uploads moved to R2

`src/lib/uploads.ts` writes to `public/uploads/` on a Node host and to an R2
bucket on Workers. The public URL is unchanged — `/api/uploads/<name>` — so
nothing above that module knows which one it is.

### 2.4 Requests are read from the right place

This one is worth explaining, because it was a real bug on Workers and it
would have been invisible otherwise.

On Cloudflare Workers the request is forwarded to the Next.js server function
over an **internal** origin. A request that arrived at
`https://knyimediabuyer.xyz/admin` is presented to the application as
`http://localhost:8787/admin`.

That broke three things:

- the **origin check** on writes compared the browser's `Origin` header
  against the internal host, so every legitimate write was rejected with 403;
- the **Secure flag** on cookies was derived from the internal origin, which
  is plain HTTP, so the session cookie would have been downgraded;
- the **SEO audit** would have tried to fetch `localhost` from inside the
  Worker, where nothing is listening.

`src/lib/request-origin.ts` is now the single place that knows this. It
reads `x-forwarded-host` and `x-forwarded-proto` first and falls back to the
request URL, so the same code is correct on a Node host and on Workers.

### 2.5 Hash links are plain anchors now

Not a Cloudflare change, but it was found while testing it.

`next/link` with a hash-only `href` — `href="#contact"` — resolves to the
current route and **prefetches it**. The public page's navigation, footer and
hero all used `next/link` for in-page anchors, so every page load fired a
prefetch of the whole public page, and the response was left open. That held
a connection per page and made the page's network never go idle.

They are plain `<a>` elements now. In-page anchors do not need client-side
navigation, and the prefetch was pure waste. The console's two "view the
public site" links also carry `prefetch={false}`.

### 2.6 The revalidation cache

`revalidatePath("/")` in the console has to purge the public page's cached
copy so the next request re-renders it from the store. On Workers that needs
an incremental cache (R2) and a tag cache (D1).

| | Binding | Resource |
|---|---|---|
| Incremental cache | `NEXT_INC_CACHE_R2_BUCKET` | R2 bucket `knyi-cache` |
| Tag cache | `NEXT_TAG_CACHE_D1` | D1 database `knyi-cache` |

The tag cache needs a `revalidations` table. The migration is in
`migrations/cache/0001_revalidations.sql`.

---

## 3. What you have to do

### 3.1 Create the account

A free Cloudflare plan is enough for this site: the Workers free tier, two
D1 databases, two R2 buckets and the Images binding all fit.

### 3.2 Log in

```bash
npx wrangler login
```

### 3.3 Create the resources

```bash
# The application database
npx wrangler d1 create knyi-portfolio

# The revalidation tag cache
npx wrangler d1 create knyi-cache

# The upload bucket
npx wrangler r2 bucket create knyi-uploads

# The cache bucket
npx wrangler r2 bucket create knyi-cache
```

Each command prints an id. Put the two database ids into `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "knyi-portfolio",
      "database_id": "<the id knyi-portfolio printed>",
      "migrations_dir": "src/lib/db/migrations"
    },
    {
      "binding": "NEXT_TAG_CACHE_D1",
      "database_name": "knyi-cache",
      "database_id": "<the id knyi-cache printed>",
      "migrations_dir": "migrations/cache"
    }
  ]
}
```

### 3.4 Apply the migrations

```bash
npm run d1:migrate:remote                          # the application schema
npx wrangler d1 migrations apply NEXT_TAG_CACHE_D1 --remote   # the tag cache
```

### 3.5 Set the secrets

Every secret from `.env.example` that you have a value for. On Workers they
are set with `wrangler`, not in a `.env` file:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
npx wrangler secret put GA4_PROPERTY_ID
npx wrangler secret put SEARCH_CONSOLE_SITE_URL
npx wrangler secret put META_AD_ACCOUNT_ID
npx wrangler secret put META_ACCESS_TOKEN
npx wrangler secret put GOOGLE_ADS_CUSTOMER_ID
npx wrangler secret put GOOGLE_ADS_DEVELOPER_TOKEN
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put LEAD_NOTIFICATION_EMAIL
```

**`ADMIN_PASSWORD` is the one that matters now.** It is still the default
`knyi-admin-2026` in the local development setup. Set a real one before the
console is reachable by anyone else.

The values that are *not* secret — the site URL, the base path, the public
measurement ids — go in the `vars` block of `wrangler.jsonc`, because
`NEXT_PUBLIC_*` variables are inlined at **build** time and must be present
when the Worker is built, not when it runs.

### 3.6 Deploy

```bash
npm run deploy:cloudflare
```

That builds the OpenNext bundle and publishes the Worker. You get a
`workers.dev` URL. Check it:

- the public page renders,
- `/admin` signs in,
- the contact form creates a lead that appears in the console.

### 3.7 Attach the domain

Two records, if you want the console and the public site on one domain:

| Type | Name | Content |
|---|---|---|
| CNAME | `@` | `<your-worker>.workers.dev` |
| CNAME | `admin` | `<your-worker>.workers.dev` |

Then set the public site URL in `wrangler.jsonc`:

```jsonc
"vars": {
  "NEXT_PUBLIC_SITE_URL": "https://knyimediabuyer.xyz"
}
```

and **rebuild and redeploy** — the URL is inlined at build time.

### 3.8 Turn the GitHub Pages site off, or leave it

Nothing breaks either way. If you attach the domain to Cloudflare, the
`github.io` address will still serve the public portfolio from the last
export. It will drift from the live site, so the honest choice is to stop
publishing it once the domain is up:

```bash
git checkout main
git branch -D gh-pages   # or leave the branch, just stop deploying to it
```

---

## 4. The commands

| Command | What it does |
|---|---|
| `npm run dev` | The Next dev server, with the Cloudflare bindings wired in. |
| `npm run build` | The Node build. For a VPS or a container. |
| `npm run start` | Runs the Node build. |
| `npm run build:cloudflare` | The OpenNext bundle, in `.open-next/`. |
| `npm run preview:cloudflare` | The Worker on `localhost:8787`, against a local D1 and R2. |
| `npm run deploy:cloudflare` | Build and publish. |
| `npm run d1:migrate` | Apply the schema to the local D1. |
| `npm run d1:migrate:remote` | Apply the schema to the remote D1. |
| `npm run seed` | Seed the content store from `content/`. |
| `npm run migrate` | Apply the schema to the local SQLite file. |
| `npm run prune` | Apply the analytics retention policy. |
| `npm test` | The test suite. |

### The local Worker

```bash
npm run build:cloudflare
npx wrangler d1 migrations apply DB --local
npx wrangler d1 migrations apply NEXT_TAG_CACHE_D1 --local
npx wrangler dev --port 8787
```

`.dev.vars` holds the local secrets. It is git-ignored. It sets
`SITE_INTERNAL_URL=http://localhost:8787` so the SEO audit has a reachable
target locally — the audit targets the public origin by default, which is
correct in production but is advertised as `https` by the dev server.

---

## 5. What was verified

Everything below was run, not assumed.

**The Worker, against a local D1 and R2** (`wrangler dev`, full browser
end-to-end):

- the public page renders the seeded content;
- the consent banner appears and the analytics choice is honoured;
- the contact form creates a real lead, which appears in the console;
- sign-in works, and all ten console sections load;
- a lead's status can be changed, and the server sets the pipeline dates;
- the SEO audit runs and checks the pages;
- a case study can be created, and it appears on the public page — the
  revalidation path works end to end;
- the CSV export works;
- an unauthenticated request to a console API returns 401;
- no horizontal overflow at 390px;
- zero console errors.

**The Node build**, same end-to-end run, same result.

**The rest:** TypeScript 0 errors, ESLint 0 errors and 0 warnings, 62 of 62
tests passing, a clean production build, and a clean GitHub Pages export that
leaves the server build alone.

---

## 6. Still open

These were open before this stage and are unchanged by it.

1. **The admin password is still the development default.** Set it with
   `wrangler secret put ADMIN_PASSWORD` before the console is reachable.
2. **The contact details are still placeholders** — `info@knyi-portfolio.local`,
   `@knyi-portfolio`, `http://localhost:3000`. They are in the content store
   now, so the console's profile editor can fix them.
3. **The third-party integrations are disconnected** until their credentials
   exist. The console shows each one as *needs configuration* rather than
   pretending.
4. **The GitHub account is under a billing lock**, so the Pages workflow
   cannot run. The `gh-pages` branch is published by hand and the live site
   is current. Clearing the lock would let the workflow do it automatically.
5. **The SEO lockup placement is still undecided** — the footer dark room
   was the recommendation, and the "SEO & MARKETING" wording still needs to be
   reconciled with "independent performance marketer".
6. **The Pages export reads the content store from a local database.** If you
   edit content in the console on Workers, the exported site will not see it
   until the store is exported and the seed updated. Settings → Content export
   is the bridge.

---

## 7. The files

| File | What it is |
|---|---|
| `wrangler.jsonc` | The Worker: bindings, compatibility flags, the site URL. |
| `open-next.config.ts` | The OpenNext adapter: the R2 incremental cache and the D1 tag cache. |
| `src/lib/db/adapter.ts` | The storage port, the two adapters, the migration runner. |
| `src/lib/db/seed.ts` | The bundled seed content. |
| `src/lib/content.ts` | The content layer: read, write, export, seed. |
| `src/lib/request-origin.ts` | The public host and protocol of a request. |
| `src/lib/uploads.ts` | Disk on Node, R2 on Workers. |
| `migrations/cache/` | The tag cache's `revalidations` table. |
| `scripts/seed-content.mjs` | `npm run seed`. |
| `src/app/api/admin/content/export/route.ts` | The content download. |
