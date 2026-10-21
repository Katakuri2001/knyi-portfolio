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

<!-- filled in as it happens -->
