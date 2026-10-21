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
 * The path must be one the site actually serves, and it must not be a private
 * path. The public page's `generateMetadata` reads these, so the change is
 * real: the rendered title, description, canonical, Open Graph tags and robots
 * directive all follow.
 */
export async function setSeoMetadata(
  path: string,
  input: SeoMetadataInput
): Promise<SeoMetadataRow> {
  const db = await getDb();
  const timestamp = now();
  const existing = await getSeoMetadata(path);

  const row: SeoMetadataRow = {
    path,
    seo_title: input.seoTitle ?? existing?.seo_title ?? null,
    meta_description:
      input.metaDescription ?? existing?.meta_description ?? null,
    canonical_url: input.canonicalUrl ?? existing?.canonical_url ?? null,
    og_title: input.ogTitle ?? existing?.og_title ?? null,
    og_description: input.ogDescription ?? existing?.og_description ?? null,
    og_image: input.ogImage ?? existing?.og_image ?? null,
    noindex:
      input.noindex === undefined
        ? (existing?.noindex ?? 0)
        : input.noindex
          ? 1
          : 0,
    updated_at: timestamp,
  };

  await db.run(
    `INSERT INTO seo_metadata (
       path, seo_title, meta_description, canonical_url, og_title,
       og_description, og_image, noindex, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (path) DO UPDATE SET
       seo_title = excluded.seo_title,
       meta_description = excluded.meta_description,
       canonical_url = excluded.canonical_url,
       og_title = excluded.og_title,
       og_description = excluded.og_description,
       og_image = excluded.og_image,
       noindex = excluded.noindex,
       updated_at = excluded.updated_at`,
    [
      row.path, row.seo_title, row.meta_description, row.canonical_url,
      row.og_title, row.og_description, row.og_image, row.noindex,
      row.updated_at,
    ]
  );

  return row;
}

export async function getSeoMetadata(
  path: string
): Promise<SeoMetadataRow | null> {
  const db = await getDb();
  return db.first<SeoMetadataRow>(
    "SELECT * FROM seo_metadata WHERE path = ?",
    [path]
  );
}

export async function listSeoMetadata(): Promise<SeoMetadataRow[]> {
  const db = await getDb();
  return db.all<SeoMetadataRow>("SELECT * FROM seo_metadata ORDER BY path");
}

export async function deleteSeoMetadata(path: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.run(
    "DELETE FROM seo_metadata WHERE path = ?",
    [path]
  );
  return result.changes > 0;
}

/* ---------------------------------------------------------------------------
   Audit runs and issues
   --------------------------------------------------------------------------- */

export async function createAuditRun(
  id: string,
  baseUrl: string
): Promise<AuditRunRow> {
  const db = await getDb();

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

  await db.run(
    `INSERT INTO seo_audit_runs (
       id, started_at, finished_at, base_url, pages_checked,
       error_count, warning_count, info_count, status, error
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id, row.started_at, row.finished_at, row.base_url,
      row.pages_checked, row.error_count, row.warning_count, row.info_count,
      row.status, row.error,
    ]
  );

  return row;
}

export type AuditIssueInput = {
  url: string;
  issueType: string;
  severity: "error" | "warning" | "info";
  message: string;
  remediation?: string | null;
};

export async function addAuditIssue(
  runId: string,
  issue: AuditIssueInput
): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO seo_audit_issues (
       run_id, url, issue_type, severity, message, remediation, detected_at, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
    [
      runId, issue.url, issue.issueType, issue.severity, issue.message,
      issue.remediation ?? null, now(),
    ]
  );
}

export async function finishAuditRun(
  id: string,
  counts: { pages: number; errors: number; warnings: number; infos: number },
  error?: string
): Promise<void> {
  const db = await getDb();
  await db.run(
    `UPDATE seo_audit_runs SET
       finished_at = ?, pages_checked = ?, error_count = ?,
       warning_count = ?, info_count = ?, status = ?, error = ?
     WHERE id = ?`,
    [
      now(), counts.pages, counts.errors, counts.warnings, counts.infos,
      error ? "failed" : "complete", error ?? null, id,
    ]
  );
}

export async function latestAuditRun(): Promise<AuditRunRow | null> {
  const db = await getDb();
  return db.first<AuditRunRow>(
    "SELECT * FROM seo_audit_runs ORDER BY started_at DESC LIMIT 1"
  );
}

export async function auditIssues(runId: string): Promise<AuditIssueRow[]> {
  const db = await getDb();
  return db.all<AuditIssueRow>(
    `SELECT * FROM seo_audit_issues WHERE run_id = ?
      ORDER BY CASE severity WHEN 'error' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
               url, issue_type`,
    [runId]
  );
}

export async function listAuditRuns(limit = 20): Promise<AuditRunRow[]> {
  const db = await getDb();
  return db.all<AuditRunRow>(
    "SELECT * FROM seo_audit_runs ORDER BY started_at DESC LIMIT ?",
    [limit]
  );
}
