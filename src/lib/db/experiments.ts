import "server-only";

import { getDb, now } from "./index.ts";
import {
  EXPERIMENT_STATUSES,
  type ExperimentRow,
  type ExperimentStatus,
} from "./types.ts";

/**
 * The experiment log.
 *
 * There is no automated split-testing engine, and this table is not one. It
 * records the owner's own hypothesis, the change, the metric being watched, and
 * what was observed. The console never computes a winner from it: with no
 * control group there is nothing to compare against.
 */

export { EXPERIMENT_STATUSES };
export type { ExperimentStatus };

export function isExperimentStatus(value: unknown): value is ExperimentStatus {
  return (
    typeof value === "string" &&
    (EXPERIMENT_STATUSES as readonly string[]).includes(value)
  );
}

export type ExperimentInput = {
  hypothesis: string;
  target?: string | null;
  change?: string | null;
  primaryMetric?: string | null;
  secondaryMetric?: string | null;
  status?: ExperimentStatus;
  startedAt?: number | null;
  endedAt?: number | null;
  result?: string | null;
  conclusion?: string | null;
  nextAction?: string | null;
};

export async function listExperiments(): Promise<ExperimentRow[]> {
  const db = await getDb();
  return db.all<ExperimentRow>(
    `SELECT * FROM experiments
      ORDER BY CASE status WHEN 'running' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
               COALESCE(started_at, created_at) DESC`
  );
}

export async function getExperiment(id: string): Promise<ExperimentRow | null> {
  const db = await getDb();
  return db.first<ExperimentRow>(
    "SELECT * FROM experiments WHERE id = ?",
    [id]
  );
}

export async function createExperiment(
  id: string,
  input: ExperimentInput
): Promise<ExperimentRow> {
  const db = await getDb();
  const timestamp = now();

  const row: ExperimentRow = {
    id,
    hypothesis: input.hypothesis,
    target: input.target ?? null,
    change: input.change ?? null,
    primary_metric: input.primaryMetric ?? null,
    secondary_metric: input.secondaryMetric ?? null,
    status: input.status ?? "planned",
    started_at: input.startedAt ?? null,
    ended_at: input.endedAt ?? null,
    result: input.result ?? null,
    conclusion: input.conclusion ?? null,
    next_action: input.nextAction ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.run(
    `INSERT INTO experiments (
       id, hypothesis, target, change, primary_metric, secondary_metric,
       status, started_at, ended_at, result, conclusion, next_action,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id, row.hypothesis, row.target, row.change, row.primary_metric,
      row.secondary_metric, row.status, row.started_at, row.ended_at,
      row.result, row.conclusion, row.next_action, row.created_at,
      row.updated_at,
    ]
  );

  return row;
}

export async function updateExperiment(
  id: string,
  input: Partial<ExperimentInput>
): Promise<ExperimentRow | null> {
  const db = await getDb();
  const current = await getExperiment(id);
  if (!current) return null;

  const next: ExperimentRow = {
    ...current,
    hypothesis: input.hypothesis ?? current.hypothesis,
    target: input.target ?? current.target,
    change: input.change ?? current.change,
    primary_metric: input.primaryMetric ?? current.primary_metric,
    secondary_metric: input.secondaryMetric ?? current.secondary_metric,
    status: input.status ?? current.status,
    started_at: input.startedAt ?? current.started_at,
    ended_at: input.endedAt ?? current.ended_at,
    result: input.result ?? current.result,
    conclusion: input.conclusion ?? current.conclusion,
    next_action: input.nextAction ?? current.next_action,
    updated_at: now(),
  };

  await db.run(
    `UPDATE experiments SET
       hypothesis = ?, target = ?, change = ?,
       primary_metric = ?, secondary_metric = ?, status = ?,
       started_at = ?, ended_at = ?, result = ?, conclusion = ?,
       next_action = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.hypothesis, next.target, next.change, next.primary_metric,
      next.secondary_metric, next.status, next.started_at, next.ended_at,
      next.result, next.conclusion, next.next_action, next.updated_at, next.id,
    ]
  );

  return next;
}

export async function deleteExperiment(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.run("DELETE FROM experiments WHERE id = ?", [id]);
  return result.changes > 0;
}
