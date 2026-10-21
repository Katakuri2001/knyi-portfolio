import "server-only";

export {
  getDb,
  migrate,
  splitStatements,
  migrationFiles,
  closeDb,
} from "./adapter.ts";
export type { SqlDatabase, SqlParam, SqlStatement } from "./adapter.ts";

/** Unix seconds. Every timestamp in the schema uses this. */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}
