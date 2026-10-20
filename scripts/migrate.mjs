#!/usr/bin/env node
/**
 * Applies the database migrations.
 *
 * The application applies them on first connection too, so this script is for
 * the cases where you want them applied explicitly: in a container's start
 * command, in CI, or to check the schema without starting the app.
 */
import { getDb, DATA_DIR, closeDb } from "../src/lib/db/index.ts";

const db = getDb();
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all()
  .map((row) => row.name);

console.log(`Database ready at ${DATA_DIR}`);
console.log(`Tables: ${tables.join(", ")}`);
closeDb();
