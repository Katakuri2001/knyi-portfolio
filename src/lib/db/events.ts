import "server-only";

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
export function recordEvents(
  events: IncomingEvent[],
  context: VisitorContext
): number {
  if (events.length === 0) return 0;

  const db = getDb();
  const timestamp = now();
  const utmJson = JSON.stringify(context.utm);

  const upsertVisitor = db.prepare(`
    INSERT INTO visitors (
      id, first_seen_at, last_seen_at, consent, referrer_host,
      device_category, browser_category, country,
      first_utm, first_referrer, first_path,
      last_utm, last_referrer, last_path
    ) VALUES (
      @id, @ts, @ts, 'essential', @referrer,
      @device, @browser, @country,
      @utm, @referrer, @path,
      @utm, @referrer, @path
    )
    ON CONFLICT (id) DO UPDATE SET
      last_seen_at = excluded.last_seen_at,
      device_category = COALESCE(excluded.device_category, visitors.device_category),
      browser_category = COALESCE(excluded.browser_category, visitors.browser_category),
      country = COALESCE(excluded.country, visitors.country),
      last_utm = excluded.last_utm,
      last_referrer = excluded.last_referrer,
      last_path = excluded.last_path
  `);

  const upsertSession = db.prepare(`
    INSERT INTO sessions (
      id, visitor_id, started_at, last_active_at, entry_path,
      referrer_host, utm, channel, device_category, browser_category, country
    ) VALUES (
      @id, @visitor, @ts, @ts, @path,
      @referrer, @utm, @channel, @device, @browser, @country
    )
    ON CONFLICT (id) DO UPDATE SET
      last_active_at = excluded.last_active_at
  `);

  const insertEvent = db.prepare(`
    INSERT INTO analytics_events (
      name, visitor_id, session_id, occurred_at, path, referrer_host,
      channel, utm, device_category, browser_category, country,
      props, conversion, dedupe_key
    ) VALUES (
      @name, @visitor, @session, @occurred, @path, @referrer,
      @channel, @utm, @device, @browser, @country,
      @props, @conversion, @dedupe
    )
    ON CONFLICT (dedupe_key) DO NOTHING
  `);

  const markConverted = db.prepare(`
    UPDATE sessions SET is_converted = 1, converted_at = @ts WHERE id = @id
  `);

  const write = db.transaction(() => {
    let stored = 0;

    upsertVisitor.run({
      id: context.visitorId,
      ts: timestamp,
      referrer: context.referrerHost,
      device: context.deviceCategory,
      browser: context.browserCategory,
      country: context.country,
      utm: utmJson,
      path: context.path,
    });

    upsertSession.run({
      id: context.sessionId,
      visitor: context.visitorId,
      ts: timestamp,
      path: context.path,
      referrer: context.referrerHost,
      utm: utmJson,
      channel: context.channel,
      device: context.deviceCategory,
      browser: context.browserCategory,
      country: context.country,
    });

    for (const event of events) {
      const result = insertEvent.run({
        name: event.name,
        visitor: context.visitorId,
        session: context.sessionId,
        occurred: event.occurredAt ?? timestamp,
        path: context.path,
        referrer: context.referrerHost,
        channel: context.channel,
        utm: utmJson,
        device: context.deviceCategory,
        browser: context.browserCategory,
        country: context.country,
        props: JSON.stringify(event.props ?? {}),
        conversion: event.conversion ?? null,
        dedupe: event.dedupeKey ?? null,
      });
      stored += result.changes;

      if (event.conversion) {
        markConverted.run({ ts: timestamp, id: context.sessionId });
      }
    }

    return stored;
  });

  return write();
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

export function overviewMetrics(range: Range): OverviewMetrics {
  const db = getDb();

  const counts = db
    .prepare(
      `SELECT
         (SELECT COUNT(DISTINCT visitor_id) FROM sessions
            WHERE started_at BETWEEN @from AND @to) AS visitors,
         (SELECT COUNT(*) FROM sessions
            WHERE started_at BETWEEN @from AND @to) AS sessions,
         (SELECT COUNT(*) FROM sessions
            WHERE started_at BETWEEN @from AND @to
              AND (last_active_at - started_at) >= @engaged) AS engaged,
         (SELECT COUNT(*) FROM sessions
            WHERE started_at BETWEEN @from AND @to
              AND channel = 'organic_search') AS organic,
         (SELECT COUNT(*) FROM leads
            WHERE created_at BETWEEN @from AND @to) AS leads,
         (SELECT COUNT(*) FROM leads
            WHERE created_at BETWEEN @from AND @to
              AND status IN ('qualified','proposal_sent','won')) AS qualified,
         (SELECT COUNT(*) FROM analytics_events
            WHERE occurred_at BETWEEN @from AND @to
              AND name IN ('contact_cta_click','email_click')) AS cta,
         (SELECT COUNT(*) FROM analytics_events
            WHERE occurred_at BETWEEN @from AND @to) AS events`
    )
    .get({ from: range.from, to: range.to, engaged: ENGAGED_SECONDS }) as Record<
    string,
    number
  >;

  const returning = db
    .prepare(
      `SELECT COUNT(*) AS n FROM (
         SELECT visitor_id FROM sessions
          WHERE started_at BETWEEN @from AND @to
          GROUP BY visitor_id
         HAVING COUNT(DISTINCT date(started_at, 'unixepoch')) > 1
       )`
    )
    .get({ from: range.from, to: range.to }) as { n: number };

  const visitors = counts.visitors ?? 0;
  const sessions = counts.sessions ?? 0;

  return {
    visitors,
    sessions,
    engagedSessions: counts.engaged ?? 0,
    organicSessions: counts.organic ?? 0,
    leads: counts.leads ?? 0,
    qualifiedLeads: counts.qualified ?? 0,
    contactClicks: counts.cta ?? 0,
    conversionRate: sessions > 0 ? (counts.leads ?? 0) / sessions : null,
    returningVisitorRate: visitors > 0 ? returning.n / visitors : null,
    totalEvents: counts.events ?? 0,
  };
}

export type TimePoint = { date: string; value: number };

export function eventSeries(
  name: string,
  range: Range,
  extraNames: string[] = []
): TimePoint[] {
  const db = getDb();
  const names = [name, ...extraNames];
  const placeholders = names.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT date(occurred_at, 'unixepoch') AS day, COUNT(*) AS n
         FROM analytics_events
        WHERE occurred_at BETWEEN ? AND ?
          AND name IN (${placeholders})
        GROUP BY day
        ORDER BY day`
    )
    .all(range.from, range.to, ...names) as { day: string; n: number }[];

  return fillDays(range, rows.map((row) => ({ date: row.day, value: row.n })));
}

export function sessionSeries(range: Range): TimePoint[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT date(started_at, 'unixepoch') AS day, COUNT(*) AS n
         FROM sessions
        WHERE started_at BETWEEN ? AND ?
        GROUP BY day
        ORDER BY day`
    )
    .all(range.from, range.to) as { day: string; n: number }[];

  return fillDays(range, rows.map((row) => ({ date: row.day, value: row.n })));
}

export function leadSeries(range: Range): TimePoint[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS n
         FROM leads
        WHERE created_at BETWEEN ? AND ?
        GROUP BY day
        ORDER BY day`
    )
    .all(range.from, range.to) as { day: string; n: number }[];

  return fillDays(range, rows.map((row) => ({ date: row.day, value: row.n })));
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

export function channelBreakdown(range: Range): ChannelCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         COALESCE(s.channel, 'other') AS channel,
         COUNT(DISTINCT s.id) AS sessions,
         (SELECT COUNT(*) FROM leads l
           WHERE l.created_at BETWEEN @from AND @to
             AND l.source = COALESCE(s.channel, 'other')) AS leads
       FROM sessions s
      WHERE s.started_at BETWEEN @from AND @to
      GROUP BY channel
      ORDER BY sessions DESC`
    )
    .all({ from: range.from, to: range.to }) as ChannelCount[];
}

export type LandingPageCount = { path: string; sessions: number; leads: number };

export function landingPages(range: Range, limit = 10): LandingPageCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         s.entry_path AS path,
         COUNT(DISTINCT s.id) AS sessions,
         (SELECT COUNT(*) FROM leads l
           WHERE l.created_at BETWEEN @from AND @to
             AND l.landing_path = s.entry_path) AS leads
       FROM sessions s
      WHERE s.started_at BETWEEN @from AND @to
        AND s.entry_path IS NOT NULL
      GROUP BY s.entry_path
      ORDER BY sessions DESC
      LIMIT ?`
    )
    .all({ from: range.from, to: range.to }, limit) as LandingPageCount[];
}

export type CaseStudyInterest = {
  id: string;
  title: string;
  views: number;
  cta_clicks: number;
};

export function caseStudyInterest(range: Range): CaseStudyInterest[] {
  const db = getDb();
  const rows = db
    .prepare(
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
      ORDER BY views DESC`
    )
    .all(range.from, range.to) as CaseStudyInterest[];
  return rows;
}

export type EventTypeCount = { name: string; count: number };

export function eventTypeBreakdown(range: Range): EventTypeCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT name, COUNT(*) AS count
         FROM analytics_events
        WHERE occurred_at BETWEEN ? AND ?
        GROUP BY name
        ORDER BY count DESC`
    )
    .all(range.from, range.to) as EventTypeCount[];
}

export type DeviceCount = { device: string; sessions: number };

export function deviceBreakdown(range: Range): DeviceCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT COALESCE(device_category, 'unknown') AS device,
              COUNT(DISTINCT id) AS sessions
         FROM sessions
        WHERE started_at BETWEEN ? AND ?
        GROUP BY device
        ORDER BY sessions DESC`
    )
    .all(range.from, range.to) as DeviceCount[];
}

export type ServiceInterestCount = { service: string; count: number };

export function serviceInterest(range: Range): ServiceInterestCount[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT COALESCE(service_interest, 'unspecified') AS service, COUNT(*) AS count
         FROM leads
        WHERE created_at BETWEEN ? AND ?
        GROUP BY service
        ORDER BY count DESC`
    )
    .all(range.from, range.to) as ServiceInterestCount[];
}

/** Percentage of visitors who came back on a later day. */
export function returningVisitorRate(range: Range): number | null {
  const db = getDb();
  const total = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT visitor_id) AS n FROM sessions
          WHERE started_at BETWEEN ? AND ?`
      )
      .get(range.from, range.to) as { n: number }
  ).n;

  if (total === 0) return null;

  const returning = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM (
           SELECT visitor_id FROM sessions
            WHERE started_at BETWEEN ? AND ?
            GROUP BY visitor_id
           HAVING COUNT(DISTINCT date(started_at, 'unixepoch')) > 1
         )`
      )
      .get(range.from, range.to) as { n: number }
  ).n;

  return returning / total;
}

/** Most recent events, for a live feed. */
export function recentEvents(limit = 25): EventRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM analytics_events
        ORDER BY occurred_at DESC
        LIMIT ?`
    )
    .all(limit) as EventRow[];
}

export function visitorCount(range: Range): number {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT COUNT(DISTINCT visitor_id) AS n FROM sessions
          WHERE started_at BETWEEN ? AND ?`
      )
      .get(range.from, range.to) as { n: number }
  ).n;
}

export function getVisitor(id: string): VisitorRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM visitors WHERE id = ?").get(id) as VisitorRow) ?? null
  );
}

/** Applies the retention policy. Called by the prune script and the route. */
export function pruneEvents(retentionDays: number): number {
  const db = getDb();
  const cutoff = now() - retentionDays * 86400;
  const events = db
    .prepare("DELETE FROM analytics_events WHERE occurred_at < ?")
    .run(cutoff).changes;
  const sessions = db
    .prepare("DELETE FROM sessions WHERE last_active_at < ?")
    .run(cutoff).changes;
  const visitors = db
    .prepare("DELETE FROM visitors WHERE last_seen_at < ?")
    .run(cutoff).changes;
  return events + sessions + visitors;
}
