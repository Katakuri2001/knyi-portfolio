import "server-only";

import { getDb, now } from "./index.ts";

/**
 * Integration health state.
 *
 * The console always performs a **live** check against each provider and shows
 * the live result. This table remembers the last outcome so the page can also
 * show "last successful sync" without re-querying every provider on every load.
 *
 * `detail` holds diagnostic text only. It never holds a secret, a token, a
 * service-account key or a partial credential.
 */

export type IntegrationStatus =
  | "connected"
  | "needs_configuration"
  | "error"
  | "not_supported"
  | "disabled";

export type IntegrationState = {
  key: string;
  status: IntegrationStatus;
  message: string | null;
  last_checked: number | null;
  last_success: number | null;
  detail: string | null;
};

export function recordIntegrationState(
  key: string,
  status: IntegrationStatus,
  message: string | null,
  detail: string | null = null
): void {
  const db = getDb();
  const timestamp = now();

  db.prepare(
    `INSERT INTO integration_state (
       key, status, message, last_checked, last_success, detail
     ) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET
       status = excluded.status,
       message = excluded.message,
       last_checked = excluded.last_checked,
       last_success = CASE
         WHEN excluded.status = 'connected' THEN excluded.last_checked
         ELSE integration_state.last_success
       END,
       detail = excluded.detail`
  ).run(
    key,
    status,
    message,
    timestamp,
    status === "connected" ? timestamp : null,
    detail
  );
}

export function integrationStates(): IntegrationState[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM integration_state")
    .all() as IntegrationState[];
}

export function integrationState(key: string): IntegrationState | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM integration_state WHERE key = ?").get(key) as
      | IntegrationState
      | undefined) ?? null
  );
}
