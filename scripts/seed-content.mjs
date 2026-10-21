#!/usr/bin/env node
/**
 * Seeds the content store from the files in `content/`.
 *
 * The store is what the site serves. The files are the **seed**: they are
 * bundled with the code and used when the store has no row for a kind, so a
 * fresh deployment renders correctly before anything is seeded.
 *
 * This script writes the seed into the store. It is for a fresh database, or
 * for restoring a checkout. It does **not** overwrite what is already there —
 * the console's edits are the live copy, and a seed script must not silently
 * undo them.
 *
 *     npm run seed
 *
 * The files are read from disk rather than imported, because a JSON import
 * needs an import attribute under plain Node and the bundled seed is meant
 * for the application, not for a script.
 */
import fs from "node:fs";
import path from "node:path";
import { getDb, closeDb } from "../src/lib/db/adapter.ts";

/** The content kinds, and the file each one is seeded from. */
const KINDS = {
  profile: "profile.json",
  services: "services.json",
  tools: "tools.json",
  education: "education.json",
  "case-studies": "case-studies.json",
};

const directory = path.join(process.cwd(), "content");
const db = await getDb();
const timestamp = Math.floor(Date.now() / 1000);

let seeded = 0;
let kept = 0;

for (const [kind, file] of Object.entries(KINDS)) {
  const source = path.join(directory, file);
  if (!fs.existsSync(source)) {
    console.warn(`  ${kind.padEnd(14)} — ${file} is missing, skipped`);
    continue;
  }

  const existing = await db.first(
    "SELECT COUNT(*) AS n FROM content_documents WHERE kind = ?",
    [kind]
  );

  if (existing && existing.n > 0) {
    kept++;
    continue;
  }

  const data = fs.readFileSync(source, "utf-8");
  // Parsed first, so a broken file is reported rather than stored.
  JSON.parse(data);

  await db.run(
    `INSERT INTO content_documents (kind, data, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT (kind) DO NOTHING`,
    [kind, data, timestamp]
  );
  seeded++;
}

console.log(
  seeded === 0
    ? `Nothing was changed — the store already had content (${kept} document(s)).`
    : `Seeded ${seeded} content document(s); ${kept} were already there.`
);

const rows = await db.all(
  "SELECT kind, length(data) AS bytes FROM content_documents ORDER BY kind"
);
for (const row of rows) {
  console.log(`  ${String(row.kind).padEnd(14)} ${row.bytes} bytes`);
}

closeDb();
