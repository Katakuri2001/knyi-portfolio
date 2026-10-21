import { getDb, now } from "./index.ts";
import type {
  Channel,
  UtmSet,
} from "../analytics/attribution.ts";
import type { EventRow, VisitorRow } from "./types.ts";

/**
 * First-party event storage and reporting.
 *
 * The public site posts validated events here; the console reads them back.
 * Every query is bounded by an explicit date range and a `LIMIT`, because the
 * console is a reporting surface, not a data dump.
 */

export type VisitorContext = {
  visitorId: string;
  sessionId: string;
  path: string | null;
  referrerHost: string | null;
  channel: Channel;
  utm: UtmSet;
  deviceCategory: string | null;
  browserCategory: string | null;
  country: string | null;
};

export type IncomingEvent = {
  name: string;
  props: Record<string, string | number>;
  /** Set by the server for a conversion, so a client cannot claim one. */
  conversion?: string | null;
  /** Deduplication key. A second event with the same key is ignored. */
  dedupeKey?: string | null;
  occurredAt?: number;
};

/** Records a batch of validated events. Returns how many were stored. */
export async function recordEvents(
  events: IncomingEvent[],
  context: VisitorContext
): Promise<number> {
  if (events.length === 0) return 0;

  const db = await getDb();
  const timestamp = now();
  const utmJson = JSON.stringify(context.utm);

  await db.run(
    `INSERT INTO visitors (
      id, first_seen_at, last_seen_at, consent, referrer_host,
      device_category, browser_category, country,
      first_utm, first_referrer, first_path,
      last_utm, last_referrer, last_path
    ) VALUES (
      ?, ?, ?, 'essential', ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
    ON CONFLICT (id) DO UPDATE SET
      last_seen_at = excluded.last_seen_at,
      device_category = COALESCE(excluded.device_category, visitors.device_category),
      browser_category = COALESCE(excluded.browser_category, visitors.browser_category),
      country = COALESCE(excluded.country, visitors.country),
      last_utm = excluded.last_utm,
      last_referrer = excluded.last_referrer,
      last_path = excluded.last_path`,
    [
      context.visitorId, timestamp, timestamp, context.referrerHost,
      context.deviceCategory, context.browserCategory, context.country,
      utmJson, context.referrerHost, context.path,
      utmJson, context.referrerHost, context.path,
    ]
  );

  await db.run(
    `INSERT INTO sessions (
      id, visitor_id, started_at, last_active_at, entry_path,
      referrer_host, utm, channel, device_category, browser_category, country
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT (id) DO UPDATE SET
      last_active_at = excluded.last_active_at`,
    [
      context.sessionId, context.visitorId, timestamp, timestamp, context.path,
      context.referrerHost, utmJson, context.channel, context.deviceCategory,
      context.browserCategory, context.country,
    ]
  );

  // One batch, so the whole set lands together and a duplicate key is ignored
  // by the unique index rather than by a read-then-write check.
  const statements = events.map((event) => ({
    sql: `INSERT INTO analytics_events (
        name, visitor_id, session_id, occurred_at, path, referrer_host,
        channel, utm, device_category, browser_category, country,
        props, conversion, dedupe_key
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
      ON CONFLICT (dedupe_key) DO NOTHING`,
    params: [
      event.name,
      context.visitorId,
      context.sessionId,
      event.occurredAt ?? timestamp,
      context.path,
      context.referrerHost,
      context.channel,
      utmJson,
      context.deviceCategory,
      context.browserCategory,
      context.country,
      JSON.stringify(event.props ?? {}),
      event.conversion ?? null,
      event.dedupeKey ?? null,
    ],
  }));

  // A batch cannot report per-statement change counts, so the number of
  // events that were *actually* stored is measured rather than assumed: the
  // duplicates that were already there are counted first.
  const keys = events
    .map((event) => event.dedupeKey)
    .filter((key): key is string => Boolean(key));

  let alreadyStored = 0;
  if (keys.length > 0) {
    const placeholders = keys.map(() => "?").join(",");
    const existing = await db.all<{ dedupe_key: string }>(
      `SELECT dedupe_key FROM analytics_events
        WHERE dedupe_key IN (${placeholders})`,
      keys
    );
    alreadyStored = existing.length;
  }

  await db.batch(statements);

  const conversions = events.filter((event) => event.conversion);
  if (conversions.length > 0) {
    await db.run(
      `UPDATE sessions SET is_converted = 1, converted_at = ? WHERE id = ?`,
      [timestamp, context.sessionId]
    );
  }

  return events.length - alreadyStored;
}

/* ---------------------------------------------------------------------------
   Reporting
   --------------------------------------------------------------------------- */

export type Range = { from: number; to: number };

export type OverviewMetrics = {
  visitors: number;
  sessions: number;
  engagedSessions: number;
  organicSessions: number;
  leads: number;
  qualifiedLeads: number;
  contactClicks: number;
  conversionRate: number | null;
  returningVisitorRate: number | null;
  totalEvents: number;
};

/**
 * A session counts as *engaged* when it lasted longer than 30 seconds or
 * produced a second event. This is the GA4-style definition, simplified.
 */
const ENGAGED_SECONDS = 30;

export async function overviewMetrics(
  range: Range
): Promise<OverviewMetrics> {
  const db = await getDb();

  const counts = await db.first<Record<string, number>>(
    `SELECT
       (SELECT COUNT(DISTINCT visitor_id) FROM sessions
          WHERE started_at BETWEEN ? AND ?) AS visitors,
       (SELECT COUNT(*) FROM sessions
          WHERE started_at BETWEEN ? AND ?) AS sessions,
       (SELECT COUNT(*) FROM sessions
          WHERE started_at BETWEEN ? AND ?
            AND (last_active_at - started_at) >= ?) AS engaged,
       (SELECT COUNT(*) FROM sessions
          WHERE started_at BETWEEN ? AND ?
            AND channel = 'organic_search') AS organic,
       (SELECT COUNT(*) FROM leads
          WHERE created_at BETWEEN ? AND ?) AS leads,
       (SELECT COUNT(*) FROM leads
          WHERE created_at BETWEEN ? AND ?
            AND status IN ('qualified','proposal_sent','won')) AS qualified,
       (SELECT COUNT(*) FROM analytics_events
          WHERE occurred_at BETWEEN ? AND ?
            AND name IN ('contact_cta_click','email_click')) AS cta,
       (SELECT COUNT(*) FROM analytics_events
          WHERE occurred_at BETWEEN ? AND ?) AS events`,
    [
      range.from, range.to,
      range.from, range.to,
      range.from, range.to, ENGAGED_SECONDS,
      range.from, range.to,
      range.from, range.to,
      range.from, range.to,
      range.from, range.to,
      range.from, range.to,
    ]
  );

  const row = counts ?? {};

  const returning = await db.first<{ n: number }>(
    `SELECT COUNT(*) AS n FROM (
       SELECT visitor_id FROM sessions
        WHERE started_at BETWEEN ? AND ?
        GROUP BY visitor_id
       HAVING COUNT(DISTINCT date(started_at, 'unixepoch')) > 1
     )`,
    [range.from, range.to]
  );

  const visitors = row.visitors ?? 0;
  const sessions = row.sessions ?? 0;

  return {
    visitors,
    sessions,
    engagedSessions: row.engaged ?? 0,
    organicSessions: row.organic ?? 0,
    leads: row.leads ?? 0,
    qualifiedLeads: row.qualified ?? 0,
    contactClicks: row.cta ?? 0,
    conversionRate: sessions > 0 ? (row.leads ?? 0) / sessions : null,
    returningVisitorRate:
      visitors > 0 ? (returning?.n ?? 0) / visitors : null,
    totalEvents: row.events ?? 0,
  };
}

export type TimePoint = { date: string; value: number };

export async function eventSeries(
  name: string,
  range: Range,
  extraNames: string[] = []
): Promise<TimePoint[]> {
  const db = await getDb();
  const names = [name, ...extraNames];
  const placeholders = names.map(() => "?").join(",");

  const rows = await db.all<{ day: string; n: number }>(
    `SELECT date(occurred_at, 'unixepoch') AS day, COUNT(*) AS n
       FROM analytics_events
      WHERE occurred_at BETWEEN ? AND ?
        AND name IN (${placeholders})
      GROUP BY day
      ORDER BY day`,
    [range.from, range.to, ...names]
  );

  return fillDays(
    range,
    rows.map((row) => ({ date: row.day, value: row.n }))
  );
}

export async function sessionSeries(range: Range): Promise<TimePoint[]> {
  const db = await getDb();
  const rows = await db.all<{ day: string; n: number }>(
    `SELECT date(started_at, 'unixepoch') AS day, COUNT(*) AS n
       FROM sessions
      WHERE started_at BETWEEN ? AND ?
      GROUP BY day
      ORDER BY day`,
    [range.from, range.to]
  );

  return fillDays(
    range,
    rows.map((row) => ({ date: row.day, value: row.n }))
  );
}

export async function leadSeries(range: Range): Promise<TimePoint[]> {
  const db = await getDb();
  const rows = await db.all<{ day: string; n: number }>(
    `SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS n
       FROM leads
      WHERE created_at BETWEEN ? AND ?
      GROUP BY day
      ORDER BY day`,
    [range.from, range.to]
  );

  return fillDays(
    range,
    rows.map((row) => ({ date: row.day, value: row.n }))
  );
}

/** Fills missing days with zero so a chart never has a gap it implies. */
function fillDays(range: Range, points: TimePoint[]): TimePoint[] {
  const byDay = new Map(points.map((point) => [point.date, point.value]));
  const out: TimePoint[] = [];
  const start = new Date(range.from * 1000);
  const end = new Date(range.to * 1000);
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );
  while (cursor.getTime() <= end.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ date: key, value: byDay.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export type ChannelCount = { channel: string; sessions: number; leads: number };

export async function channelBreakdown(
  range: Range
): Promise<ChannelCount[]> {
  const db = await getDb();
  return db.all<ChannelCount>(
    `SELECT
       COALESCE(s.channel, 'other') AS channel,
       COUNT(DISTINCT s.id) AS sessions,
       (SELECT COUNT(*) FROM leads l
         WHERE l.created_at BETWEEN ? AND ?
           AND l.source = COALESCE(s.channel, 'other')) AS leads
     FROM sessions s
    WHERE s.started_at BETWEEN ? AND ?
    GROUP BY channel
    ORDER BY sessions DESC`,
    [range.from, range.to, range.from, range.to]
  );
}

export type LandingPageCount = {
  path: string;
  sessions: number;
  leads: number;
};

export async function landingPages(
  range: Range,
  limit = 10
): Promise<LandingPageCount[]> {
  const db = await getDb();
  return db.all<LandingPageCount>(
    `SELECT
       s.entry_path AS path,
       COUNT(DISTINCT s.id) AS sessions,
       (SELECT COUNT(*) FROM leads l
         WHERE l.created_at BETWEEN ? AND ?
           AND l.landing_path = s.entry_path) AS leads
     FROM sessions s
    WHERE s.started_at BETWEEN ? AND ?
      AND s.entry_path IS NOT NULL
    GROUP BY s.entry_path
    ORDER BY sessions DESC
    LIMIT ?`,
    [range.from, range.to, range.from, range.to, limit]
  );
}

export type CaseStudyInterest = {
  id: string;
  title: string;
  views: number;
  cta_clicks: number;
};

export async function caseStudyInterest(
  range: Range
): Promise<CaseStudyInterest[]> {
  const db = await getDb();
  return db.all<CaseStudyInterest>(
    `SELECT
       json_extract(props, '$.case_study_id') AS id,
       json_extract(props, '$.case_study_title') AS title,
       COUNT(DISTINCT session_id) AS views,
       SUM(CASE WHEN name = 'case_study_cta_click' THEN 1 ELSE 0 END) AS cta_clicks
     FROM analytics_events
    WHERE occurred_at BETWEEN ? AND ?
      AND name IN ('case_study_view', 'case_study_cta_click')
      AND json_extract(props, '$.case_study_id') IS NOT NULL
    GROUP BY id
    ORDER BY views DESC`,
    [range.from, range.to]
  );
}

export type EventTypeCount = { name: string; count: number };

export async function eventTypeBreakdown(
  range: Range
): Promise<EventTypeCount[]> {
  const db = await getDb();
  return db.all<EventTypeCount>(
    `SELECT name, COUNT(*) AS count
       FROM analytics_events
      WHERE occurred_at BETWEEN ? AND ?
      GROUP BY name
      ORDER BY count DESC`,
    [range.from, range.to]
  );
}

export type DeviceCount = { device: string; sessions: number };

export async function deviceBreakdown(
  range: Range
): Promise<DeviceCount[]> {
  const db = await getDb();
  return db.all<DeviceCount>(
    `SELECT COALESCE(device_category, 'unknown') AS device,
            COUNT(DISTINCT id) AS sessions
       FROM sessions
      WHERE started_at BETWEEN ? AND ?
      GROUP BY device
      ORDER BY sessions DESC`,
    [range.from, range.to]
  );
}

export type ServiceInterestCount = { service: string; count: number };

export async function serviceInterest(
  range: Range
): Promise<ServiceInterestCount[]> {
  const db = await getDb();
  return db.all<ServiceInterestCount>(
    `SELECT COALESCE(service_interest, 'unspecified') AS service, COUNT(*) AS count
       FROM leads
      WHERE created_at BETWEEN ? AND ?
      GROUP BY service
      ORDER BY count DESC`,
    [range.from, range.to]
  );
}

/** Percentage of visitors who came back on a later day. */
export async function returningVisitorRate(
  range: Range
): Promise<number | null> {
  const db = await getDb();
  const total = await db.first<{ n: number }>(
    `SELECT COUNT(DISTINCT visitor_id) AS n FROM sessions
      WHERE started_at BETWEEN ? AND ?`,
    [range.from, range.to]
  );

  if (!total || total.n === 0) return null;

  const returning = await db.first<{ n: number }>(
    `SELECT COUNT(*) AS n FROM (
       SELECT visitor_id FROM sessions
        WHERE started_at BETWEEN ? AND ?
        GROUP BY visitor_id
       HAVING COUNT(DISTINCT date(started_at, 'unixepoch')) > 1
     )`,
    [range.from, range.to]
  );

  return (returning?.n ?? 0) / total.n;
}

/** Most recent events, for a live feed. */
export async function recentEvents(limit = 25): Promise<EventRow[]> {
  const db = await getDb();
  return db.all<EventRow>(
    `SELECT * FROM analytics_events
      ORDER BY occurred_at DESC
      LIMIT ?`,
    [limit]
  );
}

export async function visitorCount(range: Range): Promise<number> {
  const db = await getDb();
  const row = await db.first<{ n: number }>(
    `SELECT COUNT(DISTINCT visitor_id) AS n FROM sessions
      WHERE started_at BETWEEN ? AND ?`,
    [range.from, range.to]
  );
  return row?.n ?? 0;
}

export async function getVisitor(id: string): Promise<VisitorRow | null> {
  const db = await getDb();
  return db.first<VisitorRow>("SELECT * FROM visitors WHERE id = ?", [id]);
}

/** Applies the retention policy. Called by the prune script and the route. */
export async function pruneEvents(retentionDays: number): Promise<number> {
  const db = await getDb();
  const cutoff = now() - retentionDays * 86400;

  const events = await db.run(
    "DELETE FROM analytics_events WHERE occurred_at < ?",
    [cutoff]
  );
  const sessions = await db.run(
    "DELETE FROM sessions WHERE last_active_at < ?",
    [cutoff]
  );
  const visitors = await db.run(
    "DELETE FROM visitors WHERE last_seen_at < ?",
    [cutoff]
  );

  return events.changes + sessions.changes + visitors.changes;
}
