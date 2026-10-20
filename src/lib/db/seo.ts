import "server-only";

import { getDb, now } from "./index.ts";
import type {
  AuditIssueRow,
  AuditRunRow,
  SeoMetadataRow,
} from "./types.ts";

/**
 * SEO storage: audit runs, audit issues, and per-path metadata overrides.
 */

/* ---------------------------------------------------------------------------
   Metadata overrides
   --------------------------------------------------------------------------- */

export type SeoMetadataInput = {
  seoTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  noindex?: boolean;
};

/**
 * Writes a metadata override for a path.
 *
 * The path must be a site-relative path that is not under `/admin` or
 * `/api` — the public pages and the console are separate surfaces, and an
 * override must never be able to change the console's own metadata.
 */
export function setSeoMetadata(
  path: string,
  input: SeoMetadataInput
): SeoMetadataRow {
  const db = getDb();
  const timestamp = now();

  const existing = getSeoMetadata(path);

  const row: SeoMetadataRow = {
    path,
    seo_title: input.seoTitle ?? existing?.seo_title ?? null,
    meta_description: input.metaDescription ?? existing?.meta_description ?? null,
    canonical_url: input.canonicalUrl ?? existing?.canonical_url ?? null,
    og_title: input.ogTitle ?? existing?.og_title ?? null,
    og_description: input.ogDescription ?? existing?.og_description ?? null,
    og_image: input.ogImage ?? existing?.og_image ?? null,
    noindex: input.noindex === undefined ? (existing?.noindex ?? 0) : input.noindex ? 1 : 0,
    updated_at: timestamp,
  };

  db.prepare(
    `INSERT INTO seo_metadata (
       path, seo_title, meta_description, canonical_url, og_title,
       og_description, og_image, noindex, updated_at
     ) VALUES (
       @path, @seo_title, @meta_description, @canonical_url, @og_title,
       @og_description, @og_image, @noindex, @updated_at
     )
     ON CONFLICT (path) DO UPDATE SET
       seo_title = excluded.seo_title,
       meta_description = excluded.meta_description,
       canonical_url = excluded.canonical_url,
       og_title = excluded.og_title,
       og_description = excluded.og_description,
       og_image = excluded.og_image,
       noindex = excluded.noindex,
       updated_at = excluded.updated_at`
  ).run(row);

  return row;
}

export function getSeoMetadata(path: string): SeoMetadataRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM seo_metadata WHERE path = ?").get(path) as
      | SeoMetadataRow
      | undefined) ?? null
  );
}

export function listSeoMetadata(): SeoMetadataRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM seo_metadata ORDER BY path")
    .all() as SeoMetadataRow[];
}

export function deleteSeoMetadata(path: string): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM seo_metadata WHERE path = ?").run(path).changes > 0;
}

/* ---------------------------------------------------------------------------
   Audit runs and issues
   --------------------------------------------------------------------------- */

export function createAuditRun(id: string, baseUrl: string): AuditRunRow {
  const db = getDb();
  const row: AuditRunRow = {
    id,
    started_at: now(),
    finished_at: null,
    base_url: baseUrl,
    pages_checked: 0,
    error_count: 0,
    warning_count: 0,
    info_count: 0,
    status: "running",
    error: null,
  };

  db.prepare(
    `INSERT INTO seo_audit_runs (
       id, started_at, finished_at, base_url, pages_checked,
       error_count, warning_count, info_count, status, error
     ) VALUES (
       @id, @started_at, @finished_at, @base_url, @pages_checked,
       @error_count, @warning_count, @info_count, @status, @error
     )`
  ).run(row);

  return row;
}

export type AuditIssueInput = {
  url: string;
  issueType: string;
  severity: "error" | "warning" | "info";
  message: string;
  remediation?: string | null;
};

export function addAuditIssue(runId: string, issue: AuditIssueInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO seo_audit_issues (
       run_id, url, issue_type, severity, message, remediation, detected_at, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`
  ).run(
    runId,
    issue.url,
    issue.issueType,
    issue.severity,
    issue.message,
    issue.remediation ?? null,
    now()
  );
}

export function finishAuditRun(
  id: string,
  counts: { pages: number; errors: number; warnings: number; infos: number },
  error?: string
): void {
  const db = getDb();
  db.prepare(
    `UPDATE seo_audit_runs SET
       finished_at = @finished, pages_checked = @pages,
       error_count = @errors, warning_count = @warnings, info_count = @infos,
       status = @status, error = @error
     WHERE id = @id`
  ).run({
    id,
    finished: now(),
    pages: counts.pages,
    errors: counts.errors,
    warnings: counts.warnings,
    infos: counts.infos,
    status: error ? "failed" : "complete",
    error: error ?? null,
  });
}

export function latestAuditRun(): AuditRunRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM seo_audit_runs ORDER BY started_at DESC LIMIT 1")
      .get() as AuditRunRow) ?? null
  );
}

export function auditIssues(runId: string): AuditIssueRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM seo_audit_issues WHERE run_id = ?
        ORDER BY CASE severity WHEN 'error' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
                 url, issue_type`
    )
    .all(runId) as AuditIssueRow[];
}

export function listAuditRuns(limit = 20): AuditRunRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM seo_audit_runs ORDER BY started_at DESC LIMIT ?")
    .all(limit) as AuditRunRow[];
}
