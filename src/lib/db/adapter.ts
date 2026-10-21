import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The storage port.
 *
 * The console has to run in two places:
 *
 * - **Locally and on a Node host** — SQLite on disk, through `better-sqlite3`.
 * - **On Cloudflare Workers** — D1, which *is* SQLite but is reached over
 *   HTTP through a binding, and is asynchronous.
 *
 * Rather than write the queries twice, this module defines one narrow
 * interface. Every query in `src/lib/db/` is written against it and runs
 * unchanged in both places. Only the adapter differs.
 *
 * The interface is deliberately tiny — `all`, `first`, `run`, `batch` — because
 * everything beyond that is SQLite-specific and would tie the queries to one
 * runtime.
 */

export type SqlParam = string | number | null;

export interface SqlStatement {
  sql: string;
  params?: SqlParam[];
}

export interface SqlDatabase {
  all<T = Record<string, unknown>>(
    sql: string,
    params?: SqlParam[]
  ): Promise<T[]>;
  first<T = Record<string, unknown>>(
    sql: string,
    params?: SqlParam[]
  ): Promise<T | null>;
  run(
    sql: string,
    params?: SqlParam[]
  ): Promise<{ changes: number }>;
  /** Runs a set of statements atomically. */
  batch(statements: SqlStatement[]): Promise<void>;
}

/* ---------------------------------------------------------------------------
   Migrations

   The schema is plain SQLite, so the same files run on the local database and on
   D1. D1's `wrangler d1 migrations apply` is the production path; the runner
   here applies the same files when a connection is opened, which keeps a fresh
   checkout working with no extra step. Every statement is idempotent, so
   running them twice is safe.
   --------------------------------------------------------------------------- */

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(here, "migrations");

/**
 * Splits a SQL file into statements.
 *
 * A naive split on ";" breaks if a semicolon appears inside a string literal,
 * so quotes and comments are tracked.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let quote: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      current += char;
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        current += char + next;
        i++;
        continue;
      }
      current += char;
      continue;
    }
    if (!quote && char === "-" && next === "-") {
      inLineComment = true;
      current += char;
      continue;
    }
    if (!quote && char === "/" && next === "*") {
      inBlockComment = true;
      current += char;
      continue;
    }
    if (quote) {
      if (char === quote) {
        if (next === quote) {
          current += char + next;
          i++;
          continue;
        }
        quote = null;
      }
      current += char;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if (char === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

/** The migration files, in order. */
export function migrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

/** Applies any migration that has not run yet. */
export async function migrate(db: SqlDatabase): Promise<void> {
  await db.run(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name       TEXT PRIMARY KEY,
       applied_at INTEGER NOT NULL
     )`
  );

  const applied = new Set(
    (await db.all<{ name: string }>("SELECT name FROM schema_migrations")).map(
      (row) => row.name
    )
  );

  for (const file of migrationFiles()) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const statements: SqlStatement[] = splitStatements(sql).map((statement) => ({
      sql: statement,
      params: [],
    }));

    try {
      await db.batch(statements);
      await db.run(
        "INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)",
        [file, Math.floor(Date.now() / 1000)]
      );
    } catch (error) {
      throw new Error(
        `Migration ${file} failed: ${(error as Error).message}`
      );
    }
  }
}

/* ---------------------------------------------------------------------------
   The local adapter — SQLite on disk
   --------------------------------------------------------------------------- */

/**
 * The local database file.
 *
 * A literal path, because a path built from an environment value makes the
 * bundler trace the whole project into the server output.
 */
export const LOCAL_DB_PATH = path.join(process.cwd(), "data", "knyi.db");

async function createSqliteAdapter(): Promise<SqlDatabase> {
  // Imported dynamically: on Workers the native module is neither present nor
  // needed, and bundling it would break the Worker build.
  const { default: Database } = await import("better-sqlite3");

  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
  const db = new Database(LOCAL_DB_PATH);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  return {
    async all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
      return db.prepare(sql).all(...params) as T[];
    },
    async first<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
      const row = db.prepare(sql).get(...params);
      return (row as T | undefined) ?? null;
    },
    async run(sql: string, params: SqlParam[] = []) {
      const result = db.prepare(sql).run(...params);
      return { changes: result.changes };
    },
    async batch(statements: SqlStatement[]) {
      db.transaction(() => {
        for (const statement of statements) {
          db.prepare(statement.sql).run(...(statement.params ?? []));
        }
      })();
    },
  };
}

/* ---------------------------------------------------------------------------
   The Cloudflare adapter — D1
   --------------------------------------------------------------------------- */

/** The subset of the D1 binding this module uses. */
export interface D1Like {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
}

export interface D1PreparedStatement {
  bind(...values: SqlParam[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ meta?: { changes?: number } }>;
}

export function createD1Adapter(d1: D1Like): SqlDatabase {
  const bind = (sql: string, params: SqlParam[] = []) =>
    d1.prepare(sql).bind(...params);

  return {
    async all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
      const result = await bind(sql, params).all<T>();
      return result.results ?? [];
    },
    async first<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
      const row = await bind(sql, params).first<T>();
      return row ?? null;
    },
    async run(sql: string, params: SqlParam[] = []) {
      const result = await bind(sql, params).run();
      return { changes: result.meta?.changes ?? 0 };
    },
    async batch(statements: SqlStatement[]) {
      if (statements.length === 0) return;
      await d1.batch(
        statements.map((statement) =>
          d1.prepare(statement.sql).bind(...(statement.params ?? []))
        )
      );
    },
  };
}

/* ---------------------------------------------------------------------------
   Choosing the adapter
   --------------------------------------------------------------------------- */

let cached: SqlDatabase | null = null;
let pending: Promise<SqlDatabase> | null = null;

/**
 * The D1 binding, if we are running on Workers.
 *
 * `getCloudflareContext()` throws outside a request — during a local build,
 * for example — so it is probed rather than assumed.
 */
function cloudflareBinding(): {
  DB?: D1Like;
  UPLOADS?: R2Like;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const context = getCloudflareContext({ alwaysRedirect: false });
    return (context?.env ?? null) as {
      DB?: D1Like;
      UPLOADS?: R2Like;
    } | null;
  } catch {
    return null;
  }
}

/** The storage binding, or null when there is none. */
export function storageBinding(): {
  DB?: D1Like;
  UPLOADS?: R2Like;
} | null {
  return cloudflareBinding();
}

/**
 * The database for the current environment.
 *
 * D1 when the binding is present, the local SQLite file otherwise. The choice
 * is made once per isolate and the same queries run either way. The schema is
 * migrated on first connect, so a fresh checkout works with no extra step.
 */
export async function getDb(): Promise<SqlDatabase> {
  if (cached) return cached;
  if (pending) return pending;

  pending = (async () => {
    const binding = storageBinding();
    const db = binding?.DB
      ? createD1Adapter(binding.DB)
      : await createSqliteAdapter();
    await migrate(db);
    await seedIfEmpty(db);
    cached = db;
    return db;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

/** Test hook — points the connection at a different file. */
export async function openLocalDatabase(file: string): Promise<void> {
  const { default: Database } = await import("better-sqlite3");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  cached = {
    async all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
      return db.prepare(sql).all(...params) as T[];
    },
    async first<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
      const row = db.prepare(sql).get(...params);
      return (row as T | undefined) ?? null;
    },
    async run(sql: string, params: SqlParam[] = []) {
      const result = db.prepare(sql).run(...params);
      return { changes: result.changes };
    },
    async batch(statements: SqlStatement[]) {
      db.transaction(() => {
        for (const statement of statements) {
          db.prepare(statement.sql).run(...(statement.params ?? []));
        }
      })();
    },
  };

  await migrate(cached);
}

/** Closes the local connection. Used by the migrate script and the tests. */
export function closeDb() {
  cached = null;
  pending = null;
}

/* ---------------------------------------------------------------------------
   Seeding

   The content store starts empty on a fresh deployment. The bundled seed files
   are written in once, so the console has something to edit and the public
   page renders the reviewed content rather than nothing.
   --------------------------------------------------------------------------- */

async function seedIfEmpty(db: SqlDatabase): Promise<void> {
  let seeds: typeof import("./seed.ts");

  try {
    seeds = await import("./seed.ts");
  } catch {
    // The bundled seed is not reachable in this runtime — a plain Node script,
    // where a JSON import needs an import attribute. Nothing is lost: the
    // content layer falls back to the seed for every read, so the site still
    // renders correctly, and `npm run seed` writes the store explicitly.
    return;
  }

  const existing = await db.all<{ n: number }>(
    "SELECT COUNT(*) AS n FROM content_documents"
  );
  if ((existing[0]?.n ?? 0) > 0) return;

  const timestamp = Math.floor(Date.now() / 1000);
  await db.batch(
    seeds.CONTENT_KINDS.map((kind) => ({
      sql: `INSERT INTO content_documents (kind, data, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT (kind) DO NOTHING`,
      params: [
        kind,
        JSON.stringify(seeds.SEEDS[kind], null, 2),
        timestamp,
      ],
    }))
  );
}

/* ---------------------------------------------------------------------------
   R2 — the upload store
   --------------------------------------------------------------------------- */

export interface R2Like {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array | string,
    options?: unknown
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream | null;
    arrayBuffer(): Promise<ArrayBuffer>;
    httpMetadata?: { contentType?: string };
  } | null>;
  delete(key: string): Promise<void>;
}
