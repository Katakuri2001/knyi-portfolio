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
 * records the owner's own hypothesis, the change, the metric they are
 * watching, and what they observed. The console never computes a winner from
 * it, because with no control group there is nothing to compare against.
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

export function listExperiments(): ExperimentRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM experiments
        ORDER BY CASE status WHEN 'running' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
                 COALESCE(started_at, created_at) DESC`
    )
    .all() as ExperimentRow[];
}

export function getExperiment(id: string): ExperimentRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM experiments WHERE id = ?").get(id) as
      | ExperimentRow
      | undefined) ?? null
  );
}

export function createExperiment(
  id: string,
  input: ExperimentInput
): ExperimentRow {
  const db = getDb();
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

  db.prepare(
    `INSERT INTO experiments (
       id, hypothesis, target, change, primary_metric, secondary_metric,
       status, started_at, ended_at, result, conclusion, next_action,
       created_at, updated_at
     ) VALUES (
       @id, @hypothesis, @target, @change, @primary_metric, @secondary_metric,
       @status, @started_at, @ended_at, @result, @conclusion, @next_action,
       @created_at, @updated_at
     )`
  ).run(row);

  return row;
}

export function updateExperiment(
  id: string,
  input: Partial<ExperimentInput>
): ExperimentRow | null {
  const db = getDb();
  const current = getExperiment(id);
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

  db.prepare(
    `UPDATE experiments SET
       hypothesis = @hypothesis, target = @target, change = @change,
       primary_metric = @primary_metric, secondary_metric = @secondary_metric,
       status = @status, started_at = @started_at, ended_at = @ended_at,
       result = @result, conclusion = @conclusion, next_action = @next_action,
       updated_at = @updated_at
     WHERE id = @id`
  ).run(next);

  return next;
}

export function deleteExperiment(id: string): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM experiments WHERE id = ?").run(id).changes > 0;
}
