# Stage 7 — deployment run log

The record of the actual Cloudflare deployment. The handover is
`docs/STAGE-7-CLOUDFLARE-WORKERS.md`; this is what happened.

---

## The account

Three accounts are reachable with the login on this machine
(`kaungsethmue2001@gmail.com`):

| Account | ID | D1 | R2 |
|---|---|---|---|
| `Danielmarcos` | `ff22774a243abe09f315f2806a5f58db` | 0 | 0 |
| `danielmarcos794532` | `388abdf2ce180eacf3741ecccecb0481` | 0 | 0 |
| **`Kaungsethmue2001@gmail.com's Account`** | **`e86299bf709f164c49c7743f56829687`** | **7** | **6** |

The third is the live one — it holds the D1 databases and R2 buckets for the
other projects on this account (`aurevia-db`, `futurebite-db`, `khub`,
`survey-db`, `velora-db`, `nexusops` and the matching buckets). The other two
are dormant.

`account_id` is pinned in `wrangler.jsonc`, so no command can land in the
wrong account by accident.

## The domain

`knyimediabuyer.xyz` is registered at **Namecheap** — its nameservers are
`dns1.namecheaphosting.com` and `dns2.namecheaphosting.com`, and it resolves
to a Namecheap parking address (162.213.255.40). It is **not** on Cloudflare.

The only zone in this account is `knowledgehubmm.com`.

So the first deployment goes to a `workers.dev` URL, and `NEXT_PUBLIC_SITE_URL`
points there. A canonical URL aimed at the parked domain would tell a search
engine that the real site lives on a parking page, which is worse than an
honest `workers.dev` canonical that is replaced when the domain moves.

**To move the domain to Cloudflare:** add `knyimediabuyer.xyz` as a zone in
this account, change the nameservers at Namecheap to the two Cloudflare
nameservers Cloudflare assigns, wait for the nameserver change to propagate,
then set `NEXT_PUBLIC_SITE_URL` to `https://knyimediabuyer.xyz` and
**rebuild** — the URL is inlined at build time.

## The resources

| Resource | Name | Binding | Why |
|---|---|---|---|
| D1 | `knyi-portfolio` | `DB` | The application database |
| D1 | `knyi-cache` | `NEXT_TAG_CACHE_D1` | The revalidation tag cache |
| R2 | `knyi-uploads` | `UPLOADS` | Uploaded images |
| R2 | `knyi-cache` | `NEXT_INC_CACHE_R2_BUCKET` | The incremental cache |

The tag cache uses D1 rather than the newer sharded Durable Object, because
the D1 path is the one that was verified end to end locally — the console's
`revalidatePath("/")` was seen to regenerate the public page. The Durable
Object variant is the better long-term choice and is a one-line change in
`open-next.config.ts`; it would remove the second D1 database.

## The steps

1. Pin `account_id` in `wrangler.jsonc`.
2. Create the two D1 databases and the two R2 buckets.
3. Put the generated ids into `wrangler.jsonc`.
4. Apply the schema to both databases, remotely.
5. Set the secrets.
6. Build and deploy the Worker.
7. Verify the deployed Worker end to end.

---

## Run

### 1. The resources

```
npx wrangler d1 create knyi-portfolio    → 2618b69b-1217-4de3-a811-f9e1766aa171
npx wrangler d1 create knyi-cache        → a582a04d-0bdc-43b9-a791-98b88f25205b
npx wrangler r2 bucket create knyi-uploads
npx wrangler r2 bucket create knyi-cache
```

The two database ids went into `wrangler.jsonc`, with `account_id` pinned
alongside them.

### 2. The migrations

```
npx wrangler d1 migrations apply DB --remote
  001_init.sql          ✅
  002_content_store.sql ✅
npx wrangler d1 migrations apply NEXT_TAG_CACHE_D1 --remote
  0001_revalidations.sql ✅
```

Fourteen tables in the application database, one in the tag cache.

### 3. The secrets

`ADMIN_PASSWORD` was set to a generated 24-character value, and the old
default `knyi-admin-2026` was **never** set on the Worker. The value is
recorded in `CLOUDFLARE-CREDENTIALS.local.md`, which is git-ignored, and in
`~/.knyi-admin-password`.

The third-party secrets are not set — there are no credentials for them yet,
and the console reports each one as *needs configuration* rather than
pretending.

### 4. The deploy — and the two things that broke

**The cache population failed.** `opennextjs-cloudflare deploy` populates the
R2 incremental cache before it publishes, by starting a temporary local Worker
and asking it to write the prerendered pages into the bucket. In this wrangler
version the R2 binding is not wired into that temporary Worker, so every write
came back as

```
R2 binding "R2" is not configured
```

and the deploy aborted **before the Worker was published**.

The population is an optimisation — the cache is written on demand at runtime,
and that binding *is* configured. `scripts/deploy-cloudflare.mjs` therefore
builds and then runs `wrangler deploy` with `OPEN_NEXT_DEPLOY=true`, which is
the same publish without the pre-load. The adapter's other path,
`--rclone`, uploads over S3 instead and needs an R2 API token.

**The site URL was not in the build.** `NEXT_PUBLIC_*` is inlined at build
time, and the OpenNext build does not put the wrangler `vars` into the
`next build` environment — it only ships them to the Worker at runtime. The
public page is prerendered during the build, so the prerendered page had no
canonical URL and the sitemap was empty. `scripts/build-cloudflare.mjs` now
reads the wrangler config and passes its `vars` through, so the build and the
runtime see the same values.

### 5. Published

```
https://knyi-portfolio.kaungsethmue2001.workers.dev
```

### 6. Then the site came up wrong, and it was not Cloudflare's fault

The privacy card was transparent — the hero showed straight through it — and
on desktop the navigation rail painted over it.

Both bugs were **already on the live GitHub Pages site**. The live Pages site
was the control: it had the same transparent card and the same overlap. The
Cloudflare deployment had simply made them more visible.

- `glass-elevated`, the class the card uses, was **never defined** in
  `globals.css`. The card had no surface at all.
- The card was at `sm:left-5`, and the rail is `fixed left-6` at `z-50`
  against the card's `z-40`.

Both are fixed. The card is now a near-opaque surface at the bottom-right
from `lg` up, and above the mobile dock below it. Measured, it overlaps
neither the rail, the primary CTA nor the dock, and the worst contrast among
its own text is 6.84:1.

The Worker also returned broken images: the Workers image optimiser answered
with `Content-Disposition: attachment`, so the browser downloaded the file
instead of drawing it. The Cloudflare build now serves the originals, as the
Pages export already did.

### 7. Verified

- The deployed Worker seeded the **remote** D1's content store on its first
  request — proof that it is live and talking to the real database.
- The full browser end-to-end pass is green against the Worker: consent →
  tracking → contact form → stored lead → console → status update → SEO audit
  → case-study write-through to the public page → CSV export →
  unauthenticated rejection → mobile. Zero console errors.
- TypeScript 0 errors, ESLint 0 errors and 0 warnings, 62 of 62 tests
  passing.

### 8. The GitHub Pages site was refreshed too

The privacy card bug was on the live Pages site as well, so the site was
republished from this branch:

```
npm run deploy:pages
  → gh-pages, commit 6836064
  Source: feature/cloudflare-workers@8556717
```

`main` was not touched. The commit the script writes to `gh-pages` now
records the branch and commit it was built from, so a deploy from a working
branch and a deploy from `main` are distinguishable after the fact.

Verified on the live site: the consent card has its surface, it overlaps
neither the rail nor the CTA on desktop, the dock is clear on mobile, the
images render, the sitemap has its absolute URLs, `robots.txt` still
disallows `/admin` and `/api/`, and `/admin` is 404 on Pages — as it must
be, because the console is not part of a static export.

### 9. Not verified from this machine

This machine's network **filters the `workers.dev` domain by SNI**. The same
IP answers `developers.cloudflare.com` with 200 and `*.workers.dev` with a
TLS reset, and the account's existing `futurebite` worker times out here too.
So the deployed Worker was verified through the local Worker running the same
bundle against a local D1, and through the remote D1's contents — not by
loading the public URL from this box. A visitor on an unfiltered network is
not affected.
