/**
 * Row types for the SQLite tables.
 *
 * Kept in one file so the query modules and the API routes agree on the shape
 * of what comes out of the database.
 */

export type ConsentState = "essential" | "analytics" | "marketing" | "denied";

export type VisitorRow = {
  id: string;
  first_seen_at: number;
  last_seen_at: number;
  consent: ConsentState;
  consent_at: number | null;
  referrer_host: string | null;
  device_category: string | null;
  browser_category: string | null;
  country: string | null;
  first_utm: string | null;
  first_referrer: string | null;
  first_path: string | null;
  last_utm: string | null;
  last_referrer: string | null;
  last_path: string | null;
};

export type SessionRow = {
  id: string;
  visitor_id: string;
  started_at: number;
  last_active_at: number;
  entry_path: string | null;
  referrer_host: string | null;
  utm: string | null;
  channel: string | null;
  device_category: string | null;
  browser_category: string | null;
  country: string | null;
  is_converted: number;
  converted_at: number | null;
};

export type EventRow = {
  id: number;
  name: string;
  visitor_id: string;
  session_id: string;
  occurred_at: number;
  path: string | null;
  referrer_host: string | null;
  channel: string | null;
  utm: string | null;
  device_category: string | null;
  browser_category: string | null;
  country: string | null;
  props: string | null;
  conversion: string | null;
  dedupe_key: string | null;
};

export const EXPERIMENT_STATUSES = [
  "planned",
  "running",
  "concluded",
  "abandoned",
] as const;

export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
  "archived",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  telegram: string | null;
  phone: string | null;
  message: string | null;
  service_interest: string | null;
  status: LeadStatus;
  deal_value: number | null;
  source: string | null;
  source_detail: string | null;
  medium: string | null;
  campaign: string | null;
  landing_path: string | null;
  referrer_host: string | null;
  visitor_id: string | null;
  session_id: string | null;
  created_at: number;
  updated_at: number;
  qualified_at: number | null;
  closed_at: number | null;
  follow_up_at: number | null;
  submission_hash: string | null;
};

export type LeadNoteRow = {
  id: number;
  lead_id: string;
  body: string;
  created_at: number;
};

export type SeoMetadataRow = {
  path: string;
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: number;
  updated_at: number;
};

export type ExperimentRow = {
  id: string;
  hypothesis: string;
  target: string | null;
  change: string | null;
  primary_metric: string | null;
  secondary_metric: string | null;
  status: "planned" | "running" | "concluded" | "abandoned";
  started_at: number | null;
  ended_at: number | null;
  result: string | null;
  conclusion: string | null;
  next_action: string | null;
  created_at: number;
  updated_at: number;
};

export type CampaignRow = {
  id: string;
  name: string;
  channel: string | null;
  objective: string | null;
  service: string | null;
  starts_at: number | null;
  ends_at: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type AuditRunRow = {
  id: string;
  started_at: number;
  finished_at: number | null;
  base_url: string;
  pages_checked: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  status: "running" | "complete" | "failed";
  error: string | null;
};

export type AuditIssueRow = {
  id: number;
  run_id: string;
  url: string;
  issue_type: string;
  severity: "error" | "warning" | "info";
  message: string;
  remediation: string | null;
  detected_at: number;
  status: "open" | "resolved";
};
