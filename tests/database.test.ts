import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setDatabaseFile, closeDb } from "../src/lib/db/index.ts";
import {
  createLead,
  getLead,
  isLeadStatus,
  listLeads,
  updateLead,
  addLeadNote,
  leadNotes,
  leadCounts,
  exportLeads,
} from "../src/lib/db/leads.ts";
import {
  recordEvents,
  overviewMetrics,
  sessionSeries,
  channelBreakdown,
  pruneEvents,
} from "../src/lib/db/events.ts";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "knyi-test-"));
const DB_FILE = path.join(TMP, "test.db");

setDatabaseFile(DB_FILE);

test.after(() => {
  closeDb();
  fs.rmSync(TMP, { recursive: true, force: true });
});

/* ---------------------------------------------------------------------------
   Leads
   --------------------------------------------------------------------------- */

test("a valid lead is stored and returned", () => {
  const created = createLead(
    {
      name: "Test Client",
      email: "client@example.com",
      message: "We need a campaign plan.",
      serviceInterest: "Meta Ads planning",
      source: "organic_search",
      campaign: "seo",
    },
    "lead_test_1"
  );

  assert.ok(created, "the lead should be created");
  assert.equal(created.lead.status, "new");
  assert.equal(created.lead.email, "client@example.com");

  const stored = getLead("lead_test_1");
  assert.ok(stored);
  assert.equal(stored.name, "Test Client");
  assert.equal(stored.campaign, "seo");
});

test("a duplicate submission is refused rather than stored twice", () => {
  const first = createLead(
    { email: "dup@example.com", name: "Dup", message: "Same message" },
    "lead_dup_1"
  );
  assert.ok(first);

  const second = createLead(
    { email: "dup@example.com", name: "Dup", message: "Same message" },
    "lead_dup_2"
  );
  assert.equal(second, null, "the duplicate should be refused");
});

test("a status the server does not know is rejected", () => {
  assert.equal(isLeadStatus("qualified"), true);
  assert.equal(isLeadStatus("won"), true);
  assert.equal(isLeadStatus("invented"), false);

  const updated = updateLead("lead_test_1", {
    status: "invented" as never,
  });
  assert.equal(updated, null, "an unknown status must not be applied");
});

test("a status change sets the pipeline dates on the server", () => {
  // Its own lead, so the pipeline counts elsewhere are not disturbed.
  createLead({ email: "status@example.com" }, "lead_status_1");

  const updated = updateLead("lead_status_1", { status: "qualified" });
  assert.ok(updated);
  assert.equal(updated.status, "qualified");
  assert.ok(updated.qualified_at && updated.qualified_at > 0);

  const won = updateLead("lead_status_1", { status: "won" });
  assert.ok(won);
  assert.ok(won.closed_at && won.closed_at > 0);

  const reopened = updateLead("lead_status_1", { status: "new" });
  assert.ok(reopened);
  assert.equal(reopened.qualified_at, null);
});

test("a deal value is stored, and cleared to null", () => {
  const withValue = updateLead("lead_test_1", { dealValue: 2500 });
  assert.equal(withValue?.deal_value, 2500);

  const cleared = updateLead("lead_test_1", { dealValue: null });
  assert.equal(cleared?.deal_value, null);
});

test("notes are attached to a lead", () => {
  addLeadNote("lead_test_1", "Called them on Monday.");
  const notes = leadNotes("lead_test_1");
  assert.equal(notes.length, 1);
  assert.match(notes[0].body, /Monday/);
});

test("the list can be filtered by status and searched", () => {
  createLead(
    { email: "second@example.com", name: "Second Client" },
    "lead_test_2"
  );

  const all = listLeads({});
  assert.ok(all.total >= 2, "every stored lead is listed");

  const newOnly = listLeads({ status: "new" });
  assert.ok(newOnly.total >= 1);
  assert.ok(
    newOnly.rows.every((row) => row.status === "new"),
    "the filter returns only new leads"
  );

  const searched = listLeads({ search: "Second" });
  assert.equal(searched.total, 1);
  assert.equal(searched.rows[0].id, "lead_test_2");
});

test("the pipeline counts every status, including the empty ones", () => {
  const counts = leadCounts();
  assert.equal(counts.won, 0, "the status test reset its lead to new");
  assert.equal(counts.lost, 0);
  assert.equal(counts.qualified, 0);
  assert.ok(counts.new >= 1);
});

test("the export respects the date range", () => {
  const now = Math.floor(Date.now() / 1000);
  const rows = exportLeads({ from: now - 86400, to: now + 86400 });
  assert.ok(rows.length >= 2);

  const empty = exportLeads({ from: 0, to: 1 });
  assert.equal(empty.length, 0);
});

/* ---------------------------------------------------------------------------
   Events
   --------------------------------------------------------------------------- */

test("events are stored with their session and counted", () => {
  const now = Math.floor(Date.now() / 1000);

  const stored = recordEvents(
    [
      { name: "page_view", props: { path: "/" } },
      { name: "scroll_depth", props: { depth: 50 } },
      {
        name: "lead_created",
        props: { path: "/" },
        conversion: "lead_created",
        dedupeKey: "lead_created:lead_test_1",
      },
    ],
    {
      visitorId: "v_test_1",
      sessionId: "s_test_1",
      path: "/",
      referrerHost: "google.com",
      channel: "organic_search",
      utm: {
        source: "google",
        medium: "organic",
        campaign: "seo",
        content: null,
        term: null,
      },
      deviceCategory: "desktop",
      browserCategory: "chrome",
      country: "MM",
    }
  );

  assert.equal(stored, 3);
  void now;
});

test("a duplicate conversion is not stored twice", () => {
  const stored = recordEvents(
    [
      {
        name: "lead_created",
        props: {},
        conversion: "lead_created",
        dedupeKey: "lead_created:lead_test_1",
      },
    ],
    {
      visitorId: "v_test_1",
      sessionId: "s_test_1",
      path: "/",
      referrerHost: "google.com",
      channel: "organic_search",
      utm: {
        source: "google",
        medium: "organic",
        campaign: "seo",
        content: null,
        term: null,
      },
      deviceCategory: "desktop",
      browserCategory: "chrome",
      country: "MM",
    }
  );

  assert.equal(stored, 0, "the duplicate key must be ignored");
});

test("the overview counts the recorded data", () => {
  const now = Math.floor(Date.now() / 1000);
  const metrics = overviewMetrics({ from: now - 86400, to: now + 86400 });

  assert.equal(metrics.visitors, 1);
  assert.equal(metrics.sessions, 1);
  assert.equal(metrics.organicSessions, 1);
  assert.equal(metrics.totalEvents, 3, "the duplicate event is not counted");
  assert.ok(
    metrics.conversionRate !== null && metrics.conversionRate > 0,
    "the conversion rate is a real ratio"
  );
  assert.ok(
    Math.abs(metrics.conversionRate! - metrics.leads / metrics.sessions) < 0.0001,
    "the conversion rate is the documented ratio: enquiries ÷ sessions"
  );
});

test("the series has one point per day, with no gaps", () => {
  const now = Math.floor(Date.now() / 1000);
  const series = sessionSeries({ from: now - 6 * 86400, to: now });
  assert.equal(series.length, 7);
  assert.equal(series.reduce((sum, point) => sum + point.value, 0), 1);
});

test("channels are counted from the session record", () => {
  const now = Math.floor(Date.now() / 1000);
  const channels = channelBreakdown({ from: now - 86400, to: now + 86400 });
  const organic = channels.find((row) => row.channel === "organic_search");
  assert.equal(organic?.sessions, 1);
});

test("the retention policy deletes old events", () => {
  const now = Math.floor(Date.now() / 1000);

  // An event from a year ago.
  recordEvents(
    [{ name: "page_view", props: { path: "/" }, occurredAt: now - 365 * 86400 }],
    {
      visitorId: "v_old",
      sessionId: "s_old",
      path: "/",
      referrerHost: null,
      channel: "direct",
      utm: {
        source: null,
        medium: null,
        campaign: null,
        content: null,
        term: null,
      },
      deviceCategory: "desktop",
      browserCategory: null,
      country: null,
    }
  );

  const before = overviewMetrics({ from: 0, to: now + 1 });
  assert.ok(before.totalEvents >= 4);

  // A one-day window removes everything older than a day.
  pruneEvents(1);

  const after = overviewMetrics({ from: 0, to: now + 1 });
  assert.equal(
    after.totalEvents,
    3,
    "only the event older than the window is removed"
  );
});
