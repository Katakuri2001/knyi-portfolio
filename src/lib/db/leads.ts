import "server-only";

import { createHash } from "node:crypto";
import { getDb, now } from "./index.ts";
import {
  LEAD_STATUSES,
  type LeadNoteRow,
  type LeadRow,
  type LeadStatus,
} from "./types.ts";

/**
 * Lead storage and the lead pipeline.
 *
 * This is the only table in the schema that holds personal data. It is never
 * reachable from a public route, and it is never sent to an analytics
 * provider.
 */

export type NewLead = {
  name?: string | null;
  email?: string | null;
  telegram?: string | null;
  phone?: string | null;
  message?: string | null;
  serviceInterest?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  medium?: string | null;
  campaign?: string | null;
  landingPath?: string | null;
  referrerHost?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * A fingerprint of the submitted content, used to spot a duplicate
 * submission. It is a hash — the payload itself is never stored twice, and
 * the hash is not reversible.
 */
function submissionHash(lead: NewLead): string {
  const material = [
    (lead.email ?? "").trim().toLowerCase(),
    (lead.name ?? "").trim().toLowerCase(),
    (lead.message ?? "").trim().toLowerCase().slice(0, 200),
  ].join("|");
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
}

/** Creates a lead. Returns null when an identical submission already exists. */
export async function createLead(
  lead: NewLead,
  id: string
): Promise<{ lead: LeadRow; duplicate: boolean } | null> {
  const db = await getDb();
  const timestamp = now();
  const hash = submissionHash(lead);

  const existing = await db.first<{ id: string }>(
    "SELECT id FROM leads WHERE submission_hash = ? AND created_at > ?",
    [hash, timestamp - 86400]
  );

  if (existing) return null;

  const row: LeadRow = {
    id,
    name: lead.name ?? null,
    email: lead.email ?? null,
    telegram: lead.telegram ?? null,
    phone: lead.phone ?? null,
    message: lead.message ?? null,
    service_interest: lead.serviceInterest ?? null,
    status: "new",
    deal_value: null,
    source: lead.source ?? null,
    source_detail: lead.sourceDetail ?? null,
    medium: lead.medium ?? null,
    campaign: lead.campaign ?? null,
    landing_path: lead.landingPath ?? null,
    referrer_host: lead.referrerHost ?? null,
    visitor_id: lead.visitorId ?? null,
    session_id: lead.sessionId ?? null,
    created_at: timestamp,
    updated_at: timestamp,
    qualified_at: null,
    closed_at: null,
    follow_up_at: null,
    submission_hash: hash,
  };

  await db.run(
    `INSERT INTO leads (
       id, name, email, telegram, phone, message, service_interest, status,
       deal_value, source, source_detail, medium, campaign, landing_path,
       referrer_host, visitor_id, session_id, created_at, updated_at,
       qualified_at, closed_at, follow_up_at, submission_hash
     ) VALUES (
       ?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?
     )`,
    [row.id, row.name, row.email, row.telegram, row.phone, row.message,
     row.service_interest, row.status, row.deal_value, row.source,
     row.source_detail, row.medium, row.campaign, row.landing_path,
     row.referrer_host, row.visitor_id, row.session_id, row.created_at,
     row.updated_at, row.qualified_at, row.closed_at, row.follow_up_at,
     row.submission_hash]
  );

  return { lead: row, duplicate: false };
}

export type LeadFilters = {
  status?: LeadStatus | null;
  search?: string | null;
  from?: number | null;
  to?: number | null;
  limit?: number;
  offset?: number;
};

export type LeadList = { rows: LeadRow[]; total: number };

export async function listLeads(
  filters: LeadFilters = {}
): Promise<LeadList> {
  const db = await getDb();
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 500);
  const offset = Math.max(filters.offset ?? 0, 0);

  const where: string[] = ["1 = 1"];
  const params: (string | number | null)[] = [];

  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.from !== null && filters.from !== undefined) {
    where.push("created_at >= ?");
    params.push(filters.from);
  }
  if (filters.to !== null && filters.to !== undefined) {
    where.push("created_at <= ?");
    params.push(filters.to);
  }
  if (filters.search) {
    // Only columns that exist. `company` is not one of them — the table
    // carries name, email, telegram, phone, message, service_interest,
    // campaign and source.
    where.push(
      "(name LIKE ? OR email LIKE ? OR telegram LIKE ? OR phone LIKE ? OR message LIKE ? OR campaign LIKE ?)"
    );
    const like = `%${filters.search}%`;
    params.push(like, like, like, like, like, like);
  }

  const clause = where.join(" AND ");

  const rows = await db.all<LeadRow>(
    `SELECT * FROM leads WHERE ${clause}
      ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const totalRow = await db.first<{ n: number }>(
    `SELECT COUNT(*) AS n FROM leads WHERE ${clause}`,
    params
  );

  return { rows, total: totalRow?.n ?? 0 };
}

export async function getLead(id: string): Promise<LeadRow | null> {
  const db = await getDb();
  return db.first<LeadRow>("SELECT * FROM leads WHERE id = ?", [id]);
}

export async function leadNotes(leadId: string): Promise<LeadNoteRow[]> {
  const db = await getDb();
  return db.all<LeadNoteRow>(
    "SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC",
    [leadId]
  );
}

export async function addLeadNote(
  leadId: string,
  body: string
): Promise<LeadNoteRow> {
  const db = await getDb();
  const timestamp = now();
  await db.run(
    "INSERT INTO lead_notes (lead_id, body, created_at) VALUES (?, ?, ?)",
    [leadId, body, timestamp]
  );
  const row = await db.first<LeadNoteRow>(
    "SELECT * FROM lead_notes WHERE lead_id = ? AND created_at = ? ORDER BY id DESC LIMIT 1",
    [leadId, timestamp]
  );
  return (
    row ?? { id: 0, lead_id: leadId, body, created_at: timestamp }
  );
}

export type LeadUpdate = {
  status?: LeadStatus;
  name?: string | null;
  email?: string | null;
  telegram?: string | null;
  phone?: string | null;
  message?: string | null;
  serviceInterest?: string | null;
  dealValue?: number | null;
  followUpAt?: number | null;
  campaign?: string | null;
  source?: string | null;
};

/**
 * Updates a lead. Status transitions are validated here, not in the client:
 * the server decides when `qualified_at` and `closed_at` are set, so the
 * pipeline dates cannot be forged by a request body.
 */
export async function updateLead(
  id: string,
  update: LeadUpdate
): Promise<LeadRow | null> {
  const db = await getDb();
  const current = await getLead(id);
  if (!current) return null;

  const timestamp = now();
  const next: LeadRow = { ...current };

  if (update.status !== undefined) {
    if (!isLeadStatus(update.status)) return null;
    next.status = update.status;
    if (update.status === "qualified" && !current.qualified_at) {
      next.qualified_at = timestamp;
    }
    if (
      (update.status === "won" || update.status === "lost") &&
      !current.closed_at
    ) {
      next.closed_at = timestamp;
    }
    if (update.status === "new") next.qualified_at = null;
  }

  if (update.name !== undefined) next.name = update.name;
  if (update.email !== undefined) next.email = update.email;
  if (update.telegram !== undefined) next.telegram = update.telegram;
  if (update.phone !== undefined) next.phone = update.phone;
  if (update.message !== undefined) next.message = update.message;
  if (update.serviceInterest !== undefined) {
    next.service_interest = update.serviceInterest;
  }
  if (update.dealValue !== undefined) next.deal_value = update.dealValue;
  if (update.followUpAt !== undefined) next.follow_up_at = update.followUpAt;
  if (update.campaign !== undefined) next.campaign = update.campaign;
  if (update.source !== undefined) next.source = update.source;

  next.updated_at = timestamp;

  await db.run(
    `UPDATE leads SET
       name = ?, email = ?, telegram = ?, phone = ?,
       message = ?, service_interest = ?, status = ?,
       deal_value = ?, follow_up_at = ?, campaign = ?,
       source = ?, qualified_at = ?, closed_at = ?,
       updated_at = ?
     WHERE id = ?`,
    [
      next.name, next.email, next.telegram, next.phone, next.message,
      next.service_interest, next.status, next.deal_value, next.follow_up_at,
      next.campaign, next.source, next.qualified_at, next.closed_at,
      next.updated_at, next.id,
    ]
  );

  return next;
}

export async function deleteLead(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.run("DELETE FROM leads WHERE id = ?", [id]);
  return result.changes > 0;
}

export type LeadCounts = Record<string, number>;

export async function leadCounts(range?: {
  from: number;
  to: number;
}): Promise<LeadCounts> {
  const db = await getDb();
  const rows = range
    ? await db.all<{ status: string; n: number }>(
        `SELECT status, COUNT(*) AS n FROM leads
          WHERE created_at BETWEEN ? AND ? GROUP BY status`,
        [range.from, range.to]
      )
    : await db.all<{ status: string; n: number }>(
        "SELECT status, COUNT(*) AS n FROM leads GROUP BY status"
      );

  const counts: LeadCounts = {};
  for (const status of LEAD_STATUSES) counts[status] = 0;
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

/** Leads per campaign, using the recorded attribution. */
export type CampaignLeadCount = {
  campaign: string;
  source: string | null;
  medium: string | null;
  leads: number;
  qualified: number;
};

export async function leadsByCampaign(range: {
  from: number;
  to: number;
}): Promise<CampaignLeadCount[]> {
  const db = await getDb();
  return db.all<CampaignLeadCount>(
    `SELECT
       COALESCE(campaign, 'Unattributed') AS campaign,
       source, medium,
       COUNT(*) AS leads,
       SUM(CASE WHEN status IN ('qualified','proposal_sent','won') THEN 1 ELSE 0 END) AS qualified
     FROM leads
    WHERE created_at BETWEEN ? AND ?
    GROUP BY campaign, source, medium
    ORDER BY leads DESC`,
    [range.from, range.to]
  );
}

/** Exports leads for a CSV report, within a date range. */
export async function exportLeads(range: {
  from: number;
  to: number;
}): Promise<LeadRow[]> {
  const db = await getDb();
  return db.all<LeadRow>(
    "SELECT * FROM leads WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC",
    [range.from, range.to]
  );
}
