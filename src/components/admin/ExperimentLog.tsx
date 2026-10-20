"use client";

import { useState } from "react";
import {
  EXPERIMENT_STATUSES,
  type ExperimentRow,
  type ExperimentStatus,
} from "@/lib/db/types";

/**
 * The experiment log editor.
 *
 * Every field is the owner's own record. The console stores it and shows it
 * back; it does not compute a result, because there is no control group.
 */
export function ExperimentLog({ initial }: { initial: ExperimentRow[] }) {
  const [experiments, setExperiments] = useState<ExperimentRow[]>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    hypothesis: "",
    target: "",
    change: "",
    primaryMetric: "",
    secondaryMetric: "",
    result: "",
    conclusion: "",
    nextAction: "",
  });

  async function create() {
    if (busy || !form.hypothesis.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "planned" }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage(body?.error ?? "Could not record the experiment.");
        return;
      }
      const created = (await response.json()) as ExperimentRow;
      setExperiments((current) => [created, ...current]);
      setForm({
        hypothesis: "",
        target: "",
        change: "",
        primaryMetric: "",
        secondaryMetric: "",
        result: "",
        conclusion: "",
        nextAction: "",
      });
      setMessage("Experiment recorded.");
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, update: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/experiments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...update }),
      });
      if (!response.ok) throw new Error("Could not update.");
      const updated = (await response.json()) as ExperimentRow;
      setExperiments((current) =>
        current.map((row) => (row.id === updated.id ? updated : row))
      );
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    if (!window.confirm("Delete this experiment record?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/experiments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setExperiments((current) => current.filter((row) => row.id !== id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 border border-border bg-surface-sunken/40 p-5">
        <div>
          <label
            htmlFor="exp-hypothesis"
            className="text-meta mb-1.5 block text-muted-text"
          >
            Hypothesis
          </label>
          <textarea
            id="exp-hypothesis"
            rows={2}
            value={form.hypothesis}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                hypothesis: event.target.value,
              }))
            }
            placeholder="Making the contact CTA more prominent on case-study pages may increase qualified enquiries."
            className="w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-[0.875rem] leading-relaxed text-foreground outline-none focus:border-accent-ink"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            id="exp-target"
            label="Page or component"
            value={form.target}
            onChange={(value) =>
              setForm((current) => ({ ...current, target: value }))
            }
          />
          <Field
            id="exp-change"
            label="The change"
            value={form.change}
            onChange={(value) =>
              setForm((current) => ({ ...current, change: value }))
            }
          />
          <Field
            id="exp-primary"
            label="Primary metric"
            value={form.primaryMetric}
            onChange={(value) =>
              setForm((current) => ({ ...current, primaryMetric: value }))
            }
          />
          <Field
            id="exp-secondary"
            label="Secondary metric"
            value={form.secondaryMetric}
            onChange={(value) =>
              setForm((current) => ({ ...current, secondaryMetric: value }))
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={create}
            disabled={busy || !form.hypothesis.trim()}
            className="rounded-sm bg-accent-ink px-4 py-2 text-[0.875rem] font-medium text-white transition-colors hover:bg-accent-ink/85 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Record experiment
          </button>
          <p
            role="status"
            aria-live="polite"
            className={[
              "text-[0.8125rem]",
              message ? "text-foreground" : "sr-only",
            ].join(" ")}
          >
            {message ?? ""}
          </p>
        </div>
      </div>

      {experiments.length === 0 ? null : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {experiments.map((experiment) => (
            <li key={experiment.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-medium leading-relaxed text-foreground">
                    {experiment.hypothesis}
                  </p>
                  <p className="mt-1 font-geist-mono text-[0.6875rem] text-muted-text">
                    {experiment.target ?? "no target recorded"}
                    {experiment.primary_metric
                      ? ` · metric: ${experiment.primary_metric}`
                      : ""}
                  </p>
                  {experiment.result ? (
                    <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-text">
                      <span className="text-foreground">Result: </span>
                      {experiment.result}
                    </p>
                  ) : null}
                  {experiment.conclusion ? (
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-text">
                      <span className="text-foreground">Conclusion: </span>
                      {experiment.conclusion}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="sr-only" htmlFor={`exp-status-${experiment.id}`}>
                    Status
                  </label>
                  <select
                    id={`exp-status-${experiment.id}`}
                    value={experiment.status}
                    disabled={busy}
                    onChange={(event) =>
                      void update(experiment.id, {
                        status: event.target.value as ExperimentStatus,
                      })
                    }
                    className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-[0.8125rem] text-foreground outline-none focus:border-accent-ink"
                  >
                    {EXPERIMENT_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(open === experiment.id ? null : experiment.id)
                    }
                    className="text-[0.8125rem] text-accent-ink underline underline-offset-4"
                  >
                    {open === experiment.id ? "Close" : "Record outcome"}
                  </button>
                </div>
              </div>

              {open === experiment.id ? (
                <div className="mt-4 grid gap-4 border-l-2 border-border pl-4 lg:grid-cols-3">
                  <Field
                    id={`exp-result-${experiment.id}`}
                    label="Observed result"
                    value={experiment.result ?? ""}
                    onChange={(value) => void update(experiment.id, { result: value })}
                  />
                  <Field
                    id={`exp-conclusion-${experiment.id}`}
                    label="Conclusion"
                    value={experiment.conclusion ?? ""}
                    onChange={(value) =>
                      void update(experiment.id, { conclusion: value })
                    }
                  />
                  <Field
                    id={`exp-next-${experiment.id}`}
                    label="Next action"
                    value={experiment.next_action ?? ""}
                    onChange={(value) =>
                      void update(experiment.id, { nextAction: value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => remove(experiment.id)}
                    disabled={busy}
                    className="text-[0.8125rem] text-red-900 underline underline-offset-4 lg:col-span-3"
                  >
                    Delete this experiment
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-meta mb-1.5 block text-muted-text">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-[0.875rem] text-foreground outline-none focus:border-accent-ink"
      />
    </div>
  );
}
