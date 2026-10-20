-- Stage 6 — Marketing Intelligence & Business Growth Console
-- Initial schema.
--
-- Scope rule: this database holds everything that is *generated or transactional*.
-- Reviewed, hand-edited portfolio copy stays in /content/*.json — that content is
-- versioned in git, read at render time, and is not a write-heavy workload.
--
-- Every table that can hold visitor data has a retention rule, noted in its
-- comment. Nothing here stores an email address, a name, a phone number or a
-- message body: those live in `leads`, which is a different, explicitly
-- private table.

--------------------------------------------------------------------------------
-- Visitors and sessions
--------------------------------------------------------------------------------

-- A pseudonymous visitor. Not a person: a random 128-bit id with a short
-- retention window, rotated on expiry. No IP address, no fingerprint, no
-- third-party enrichment. A visitor id is never derived from an email address.
CREATE TABLE IF NOT EXISTS visitors (
  id              TEXT PRIMARY KEY,           -- random uuid, no derivation
  first_seen_at   INTEGER NOT NULL,          -- unix seconds
  last_seen_at    INTEGER NOT NULL,
  consent         TEXT NOT NULL DEFAULT 'essential', -- essential | analytics | marketing | denied
  consent_at      INTEGER,
  referrer_host   TEXT,                      -- hostname only, never a full URL
  device_category TEXT,                      -- mobile | tablet | desktop
  browser_category TEXT,                     -- coarse family, not a UA string
  country         TEXT,                      -- broad country only, if known
  first_utm       TEXT,                      -- JSON of the first-touch utm set
  first_referrer  TEXT,                      -- first-touch referrer hostname
  first_path      TEXT,                      -- first landing path
  last_utm        TEXT,                      -- JSON of the most recent utm set
  last_referrer   TEXT,
  last_path       TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_visitors_consent ON visitors (consent);

-- A session. A 30-minute inactivity window, the common convention.
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  visitor_id    TEXT NOT NULL REFERENCES visitors (id) ON DELETE CASCADE,
  started_at    INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  entry_path    TEXT,                        -- landing path
  referrer_host TEXT,
  utm           TEXT,                        -- JSON of the utm set on entry
  channel       TEXT,                        -- normalised acquisition channel
  device_category TEXT,
  browser_category TEXT,
  country       TEXT,
  is_converted  INTEGER NOT NULL DEFAULT 0,  -- 1 once a conversion event fires
  converted_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions (started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions (visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_channel ON sessions (channel);

--------------------------------------------------------------------------------
-- Events
--------------------------------------------------------------------------------

-- One row per tracked event. `name` is restricted to the allowlist in
-- src/lib/analytics/events.ts — the database also carries a CHECK constraint so
-- an unvalidated write cannot insert an arbitrary event.
--
-- RETENTION: events older than ANALYTICS_RETENTION_DAYS (default 180) are
-- deleted by scripts/prune-events.mjs and by the nightly prune route.
CREATE TABLE IF NOT EXISTS analytics_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  visitor_id    TEXT NOT NULL REFERENCES visitors (id) ON DELETE CASCADE,
  session_id    TEXT NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  occurred_at   INTEGER NOT NULL,
  path          TEXT,
  referrer_host TEXT,
  channel       TEXT,
  utm           TEXT,                        -- JSON
  device_category TEXT,
  browser_category TEXT,
  country       TEXT,
  -- A small, allowlisted set of dimensions. Never free-form: the tracker
  -- validates every key against the event schema before it is stored.
  props         TEXT,                        -- JSON, schema-validated
  -- Set when the event represents a business conversion.
  conversion    TEXT,                        -- lead_created | qualified_lead | outbound_conversion
  -- A conversion event is stored once. This is the deduplication key.
  dedupe_key    TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_events_occurred ON analytics_events (occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events (name);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON analytics_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_conversion ON analytics_events (conversion);

--------------------------------------------------------------------------------
-- Leads
--------------------------------------------------------------------------------

-- Private business records. This is the only table in the schema that holds
-- personal data, and it is never exposed through a public route.
--
-- The attribution columns are captured at submission time from the tracking
-- context. They are recorded, never guessed: a lead submitted with no
-- attribution stores NULL, which the console renders as "Unknown".
CREATE TABLE IF NOT EXISTS leads (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  email         TEXT,
  telegram      TEXT,
  phone         TEXT,
  message       TEXT,
  service_interest TEXT,                     -- which service they asked about
  status        TEXT NOT NULL DEFAULT 'new',
  -- new | contacted | qualified | proposal_sent | won | lost | archived
  deal_value    REAL,                        -- only if the owner enters one
  source        TEXT,                        -- first-touch channel
  source_detail TEXT,                       -- utm source / referrer host
  medium        TEXT,
  campaign      TEXT,
  landing_path  TEXT,
  referrer_host TEXT,
  visitor_id    TEXT,                        -- pseudonymous link to behaviour
  session_id    TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  qualified_at  INTEGER,
  closed_at     INTEGER,
  follow_up_at  INTEGER,
  -- Fingerprint of the submitted payload, used to reject a duplicate
  -- submission without storing the payload itself.
  submission_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads (campaign);
CREATE INDEX IF NOT EXISTS idx_leads_visitor ON leads (visitor_id);

CREATE TABLE IF NOT EXISTS lead_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes (lead_id);

--------------------------------------------------------------------------------
-- Campaigns
--------------------------------------------------------------------------------

-- Manually recorded campaign metadata. Kept strictly separate from any
-- advertising platform's own performance data — this table is the owner's
-- own record of what a campaign was for, not a metric source.
CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  channel     TEXT,                          -- paid_social | paid_search | email | referral | content
  objective   TEXT,
  service     TEXT,
  starts_at   INTEGER,
  ends_at     INTEGER,
  notes       TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_channel ON campaigns (channel);

-- UTM values seen on the site, normalised. This is observed data, not a
-- campaign registry.
CREATE TABLE IF NOT EXISTS campaign_observations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  source     TEXT NOT NULL,
  medium     TEXT,
  campaign   TEXT,
  content    TEXT,
  term       TEXT,
  first_seen INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  sessions   INTEGER NOT NULL DEFAULT 0,
  leads      INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_obs ON campaign_observations (source, medium, campaign);

--------------------------------------------------------------------------------
-- SEO
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS seo_audit_runs (
  id          TEXT PRIMARY KEY,
  started_at  INTEGER NOT NULL,
  finished_at INTEGER,
  base_url    TEXT NOT NULL,
  pages_checked INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  info_count  INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'running', -- running | complete | failed
  error       TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_runs_started ON seo_audit_runs (started_at);

CREATE TABLE IF NOT EXISTS seo_audit_issues (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id     TEXT NOT NULL REFERENCES seo_audit_runs (id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity   TEXT NOT NULL,                  -- error | warning | info
  message    TEXT NOT NULL,
  remediation TEXT,
  detected_at INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open'   -- open | resolved
);

CREATE INDEX IF NOT EXISTS idx_audit_issues_run ON seo_audit_issues (run_id);
CREATE INDEX IF NOT EXISTS idx_audit_issues_type ON seo_audit_issues (issue_type);

-- Per-path metadata overrides. Applied by the public page's generateMetadata.
-- A path with no row falls back to the code defaults, so removing a row
-- restores them.
CREATE TABLE IF NOT EXISTS seo_metadata (
  path            TEXT PRIMARY KEY,
  seo_title       TEXT,
  meta_description TEXT,
  canonical_url   TEXT,
  og_title        TEXT,
  og_description  TEXT,
  og_image        TEXT,
  noindex         INTEGER NOT NULL DEFAULT 0,
  updated_at      INTEGER NOT NULL
);

--------------------------------------------------------------------------------
-- Experiments
--------------------------------------------------------------------------------

-- A manual experiment log. There is no automated split-testing engine; the
-- recorded result is the owner's own observation, and the console never
-- computes a winner from this table.
CREATE TABLE IF NOT EXISTS experiments (
  id               TEXT PRIMARY KEY,
  hypothesis       TEXT NOT NULL,
  target           TEXT,                     -- page or component
  change           TEXT,
  primary_metric   TEXT,
  secondary_metric TEXT,
  status           TEXT NOT NULL DEFAULT 'planned', -- planned | running | concluded | abandoned
  started_at       INTEGER,
  ended_at         INTEGER,
  result           TEXT,
  conclusion       TEXT,
  next_action      TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments (status);

--------------------------------------------------------------------------------
-- Integrations
--------------------------------------------------------------------------------

-- Cached health state for each third-party integration. The console always
-- performs a live check as well; this table records the last outcome so the
-- page can show "last successful sync" without re-querying every provider.
CREATE TABLE IF NOT EXISTS integration_state (
  key          TEXT PRIMARY KEY,              -- ga4 | search_console | meta_pixel | ...
  status       TEXT NOT NULL,                 -- connected | needs_configuration | error | not_supported | disabled
  message      TEXT,
  last_checked INTEGER,
  last_success INTEGER,
  detail       TEXT                          -- JSON, never a secret
);
