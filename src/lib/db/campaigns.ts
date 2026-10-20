import "server-only";

import { getDb, now } from "./index.ts";
import type { CampaignRow } from "./types.ts";

/**
 * Campaign records and observed UTM values.
 *
 * Two different things, deliberately kept apart:
 *
 * - `campaigns` is the owner's **own record** of a campaign — its name,
 *   objective, channel and dates. It carries no metrics.
 * - `campaign_observations` is **observed** data — the UTM combinations that
 *   actually arrived on the site, with session and lead counts.
 *
 * Neither is a substitute for an advertising platform's own reporting, and
 * neither is presented as one.
 */

export type CampaignInput = {
  name: string;
  channel?: string | null;
  objective?: string | null;
  service?: string | null;
  startsAt?: number | null;
  endsAt?: number | null;
  notes?: string | null;
};

export function listCampaigns(): CampaignRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM campaigns ORDER BY COALESCE(starts_at, created_at) DESC")
    .all() as CampaignRow[];
}

export function getCampaign(id: string): CampaignRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as CampaignRow) ?? null
  );
}

export function createCampaign(id: string, input: CampaignInput): CampaignRow {
  const db = getDb();
  const timestamp = now();
  const row: CampaignRow = {
    id,
    name: input.name,
    channel: input.channel ?? null,
    objective: input.objective ?? null,
    service: input.service ?? null,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
    notes: input.notes ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  db.prepare(
    `INSERT INTO campaigns (
       id, name, channel, objective, service, starts_at, ends_at, notes,
       created_at, updated_at
     ) VALUES (
       @id, @name, @channel, @objective, @service, @starts_at, @ends_at, @notes,
       @created_at, @updated_at
     )`
  ).run(row);

  return row;
}

export function updateCampaign(
  id: string,
  input: Partial<CampaignInput>
): CampaignRow | null {
  const db = getDb();
  const current = getCampaign(id);
  if (!current) return null;

  const next: CampaignRow = {
    ...current,
    name: input.name ?? current.name,
    channel: input.channel ?? current.channel,
    objective: input.objective ?? current.objective,
    service: input.service ?? current.service,
    starts_at: input.startsAt ?? current.starts_at,
    ends_at: input.endsAt ?? current.ends_at,
    notes: input.notes ?? current.notes,
    updated_at: now(),
  };

  db.prepare(
    `UPDATE campaigns SET
       name = @name, channel = @channel, objective = @objective,
       service = @service, starts_at = @starts_at, ends_at = @ends_at,
       notes = @notes, updated_at = @updated_at
     WHERE id = @id`
  ).run(next);

  return next;
}

export function deleteCampaign(id: string): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM campaigns WHERE id = ?").run(id).changes > 0;
}

export type CampaignObservation = {
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  first_seen: number;
  last_seen: number;
  sessions: number;
  leads: number;
};

/**
 * Records a UTM combination that has been seen, and refreshes its counters.
 *
 * `sessions` counts distinct sessions that entered with this UTM set; `leads`
 * counts leads whose attribution matched it.
 */
export function observeCampaign(
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null; term: string | null },
  sessionCount: number,
  leadCount: number
): void {
  if (!utm.source) return;

  const db = getDb();
  const timestamp = now();

  db.prepare(
    `INSERT INTO campaign_observations (
       source, medium, campaign, content, term, first_seen, last_seen, sessions, leads
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (source, medium, campaign) DO UPDATE SET
       content = COALESCE(excluded.content, campaign_observations.content),
       term = COALESCE(excluded.term, campaign_observations.term),
       last_seen = excluded.last_seen,
       sessions = campaign_observations.sessions + excluded.sessions,
       leads = campaign_observations.leads + excluded.leads`
  ).run(
    utm.source,
    utm.medium,
    utm.campaign,
    utm.content,
    utm.term,
    timestamp,
    timestamp,
    sessionCount,
    leadCount
  );
}

export function listObservations(): CampaignObservation[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM campaign_observations
        ORDER BY sessions DESC, last_seen DESC`
    )
    .all() as CampaignObservation[];
}
