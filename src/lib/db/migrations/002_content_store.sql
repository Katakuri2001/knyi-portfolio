-- The reviewed portfolio content, as JSON documents.
--
-- One row per content kind. The files in /content are the seed: they are
-- bundled with the code and used when a row is missing, so a fresh deployment
-- renders correctly before anything is seeded.
--
-- Storing the content here rather than on disk is what lets the console work
-- on a platform with no writable filesystem.
CREATE TABLE IF NOT EXISTS content_documents (
  kind       TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
