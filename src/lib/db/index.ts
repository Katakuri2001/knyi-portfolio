import "server-only";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

/**
 * SQLite connection and migration runner.
 *
 * ## Why SQLite
 *
 * The data this console holds is low-volume and append-heavy: a portfolio
 * visitor produces a handful of events, a visitor produces perhaps one lead. A
 * single SQLite file is the simplest thing that is genuinely a database —
 * queryable, indexed, transactional, and backed up by copying one file. It
 * needs no account, no service, and no connection pool.
 *
 * A JSON file would be the wrong tool: every event write would rewrite the
 * whole document, and every date-range query would load and filter it in
 * JavaScript.
 *
 * ## Where the file lives
 *
 * `KNYI_DATA_DIR` (default `./data`) — deliberately outside `content/`, because
 * `content/` is the reviewed, git-versioned portfolio copy and `data/` is
 * generated. The directory is gitignored.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Where the database file lives.
 *
 * The path is a literal, joined onto the working directory. That is
 * deliberate: a path built from an environment value makes the bundler trace
 * the entire project into the server output, because it cannot prove the
 * result stays inside the application directory. `path.join(process.cwd(),
 * "data")` is statically scoped, so the bundler knows exactly what is
 * included.
 *
 * In a container, mount a volume at `/app/data` and the database persists
 * across deploys. Locally, `./data` is gitignored.
 */
export const DATA_DIR = path.join(process.cwd(), "data");

export const DB_PATH = path.join(DATA_DIR, "knyi.db");

let connection: Database.Database | null = null;
let pathOverride: string | null = null;

/**
 * Points the connection at a different file.
 *
 * A test seam, and the only way to get at it: the production path is a
 * literal so the bundler can statically scope it.
 */
export function setDatabaseFile(filePath: string) {
  connection?.close();
  connection = null;
  pathOverride = filePath;
}

/** Opens the database, creating the directory and applying migrations once. */
export function getDb(): Database.Database {
  if (connection) return connection;

  const dbPath = pathOverride ?? DB_PATH;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);

  // WAL keeps reads from blocking writes — the console reads while the public
  // site writes. `foreign_keys` makes the CASCADE rules actually apply.
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  migrate(db);
  connection = db;
  return db;
}

/** Closes the connection. Used by tests and by the migrate script. */
export function closeDb() {
  connection?.close();
  connection = null;
}

const MIGRATIONS_DIR = path.join(here, "migrations");

/**
 * Applies any migration that has not run yet.
 *
 * Migrations are plain `.sql` files named `NNN_name.sql`, applied in order and
 * recorded in `schema_migrations`. Each one is written to be idempotent
 * (`CREATE TABLE IF NOT EXISTS`), so a partially applied migration can be
 * re-run safely.
 */
export function migrate(db: Database.Database): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name       TEXT PRIMARY KEY,
       applied_at INTEGER NOT NULL
     )`
  );

  const applied = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row) => (row as { name: string }).name)
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(
        file,
        Math.floor(Date.now() / 1000)
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
}

/** Unix seconds. Every timestamp in the schema uses this. */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}
