-- The tag cache for the incremental revalidation.
--
-- The OpenNext adapter stores, for each cache tag, the time it was last
-- revalidated. `revalidatePath("/")` in the console writes a row here, and the
-- next request for the public page sees that the cached copy is stale and
-- re-renders it from the content store.
--
-- This is the schema the adapter expects, and it lives in the *cache*
-- database rather than the application database: it is generated state, not
-- content.
CREATE TABLE IF NOT EXISTS revalidations (
  tag         TEXT NOT NULL,
  revalidatedAt INTEGER NOT NULL,
  stale       INTEGER,
  expire      INTEGER DEFAULT NULL,
  UNIQUE(tag) ON CONFLICT REPLACE
);
