import "server-only";

import { getDb, now } from "./index.ts";
import type { CampaignRow } from "./types.ts";

/**
 * Campaign records and observed UTM values.
 *
 * Two different things, deliberately kept apart:
 *
 * - `campaigns` is the owner's **own record** of a campaign — its name,
 *   channel, objective and dates. It carries no metrics.
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

export async function listCampaigns(): Promise<CampaignRow[]> {
  const db = await getDb();
  return db.all<CampaignRow>(
    "SELECT * FROM campaigns ORDER BY COALESCE(starts_at, created_at) DESC"
  );
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  const db = await getDb();
  return db.first<CampaignRow>("SELECT * FROM campaigns WHERE id = ?", [id]);
}

export async function createCampaign(
  id: string,
  input: CampaignInput
): Promise<CampaignRow> {
  const db = await getDb();
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

  await db.run(
    `INSERT INTO campaigns (
       id, name, channel, objective, service, starts_at, ends_at, notes,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id, row.name, row.channel, row.objective, row.service,
      row.starts_at, row.ends_at, row.notes, row.created_at, row.updated_at,
    ]
  );

  return row;
}

export async function updateCampaign(
  id: string,
  input: Partial<CampaignInput>
): Promise<CampaignRow | null> {
  const db = await getDb();
  const current = await getCampaign(id);
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

  await db.run(
    `UPDATE campaigns SET
       name = ?, channel = ?, objective = ?, service = ?,
       starts_at = ?, ends_at = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.name, next.channel, next.objective, next.service,
      next.starts_at, next.ends_at, next.notes, next.updated_at, next.id,
    ]
  );

  return next;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.run("DELETE FROM campaigns WHERE id = ?", [id]);
  return result.changes > 0;
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
export async function observeCampaign(
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    content: string | null;
    term: string | null;
  },
  sessionCount: number,
  leadCount: number
): Promise<void> {
  if (!utm.source) return;

  const db = await getDb();
  const timestamp = now();

  await db.run(
    `INSERT INTO campaign_observations (
       source, medium, campaign, content, term, first_seen, last_seen, sessions, leads
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (source, medium, campaign) DO UPDATE SET
       content = COALESCE(excluded.content, campaign_observations.content),
       term = COALESCE(excluded.term, campaign_observations.term),
       last_seen = excluded.last_seen,
       sessions = campaign_observations.sessions + excluded.sessions,
       leads = campaign_observations.leads + excluded.leads`,
    [
      utm.source, utm.medium, utm.campaign, utm.content, utm.term,
      timestamp, timestamp, sessionCount, leadCount,
    ]
  );
}

export async function listObservations(): Promise<CampaignObservation[]> {
  const db = await getDb();
  return db.all<CampaignObservation>(
    "SELECT * FROM campaign_observations ORDER BY sessions DESC, last_seen DESC"
  );
}
