"use client";

import { useEffect, useState } from "react";
import type { LeadRow, LeadStatus } from "@/lib/db/types";
import { LEAD_STATUSES } from "@/lib/db/types";

/**
 * The lead list.
 *
 * Search, filter by status, update a status, add a note, set a follow-up date
 * and record a deal value. Every write goes through the admin API, which
 * validates it server-side — the client cannot invent a pipeline state.
 */
export function LeadManager() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      params.set("limit", "200");

      const response = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!response.ok) throw new Error("Could not load the leads.");
      const body = (await response.json()) as { rows: LeadRow[]; total: number };
      setLeads(body.rows);
      setTotal(body.total);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (search) params.set("q", search);
        params.set("limit", "200");

        const response = await fetch(`/api/admin/leads?${params.toString()}`);
        if (!response.ok) throw new Error("Could not load the leads.");
        const body = (await response.json()) as { rows: LeadRow[]; total: number };
        if (cancelled) return;
        setLeads(body.rows);
        setTotal(body.total);
      } catch (error) {
        if (!cancelled) setMessage((error as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function patch(lead: LeadRow, update: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, ...update }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage(body?.error ?? "Could not update the lead.");
        return;
      }

      const updated = (await response.json()) as LeadRow;
      setLeads((current) =>
        current.map((row) => (row.id === updated.id ? updated : row))
      );
    } catch {
      setMessage("Could not update the lead.");
    } finally {
      setBusy(false);
    }
  }

  async function addNote(lead: LeadRow, note: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, note }),
      });
      if (!response.ok) throw new Error("Could not save the note.");
      setMessage("Note saved.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(lead: LeadRow) {
    if (
      !window.confirm(
        `Delete the enquiry from ${lead.name ?? lead.email ?? "this visitor"}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/leads?id=${encodeURIComponent(lead.id)}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Could not delete the lead.");
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div className="min-w-[14rem] flex-1">
          <label
            htmlFor="lead-search"
            className="text-meta mb-1.5 block text-muted-text"
          >
            Search
          </label>
          <input
            id="lead-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onBlur={() => void load()}
            placeholder="Name, email or message"
            className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="lead-status"
            className="text-meta mb-1.5 block text-muted-text"
          >
            Status
          </label>
          <select
            id="lead-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="glass-surface rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <p className="text-[0.8125rem] text-muted-text">
          {loading ? "Loading…" : `${total} enquiry${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={[
          "mb-3 text-[0.8125rem]",
          message ? "text-foreground" : "sr-only",
        ].join(" ")}
      >
        {message ?? ""}
      </p>

      {!loading && leads.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-10 text-center">
          <p className="text-[0.9375rem] font-medium text-foreground">
            No enquiries have been recorded
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[0.875rem] leading-relaxed text-muted-text">
            Enquiries submitted through the public contact form appear here with
            their source. Nothing is recorded until a visitor sends one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {leads.map((lead) => (
            <li key={lead.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-medium text-foreground">
                    {lead.name ?? "Unnamed enquiry"}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-muted-text">
                    {lead.email ?? lead.telegram ?? lead.phone ?? "No contact given"}
                    {lead.service_interest
                      ? ` · ${lead.service_interest}`
                      : ""}
                  </p>
                  <p className="mt-1 font-geist-mono text-[0.6875rem] text-muted-text">
                    {new Date(lead.created_at * 1000)
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")}{" "}
                    UTC · source: {lead.source ?? "Unknown"} · campaign:{" "}
                    {lead.campaign ?? "Unattributed"} · landing:{" "}
                    {lead.landing_path ?? "Unknown"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="sr-only" htmlFor={`status-${lead.id}`}>
                    Status for {lead.name ?? "lead"}
                  </label>
                  <select
                    id={`status-${lead.id}`}
                    value={lead.status}
                    disabled={busy}
                    onChange={(event) =>
                      void patch(lead, { status: event.target.value as LeadStatus })
                    }
                    className="glass-surface rounded-lg px-2.5 py-1.5 text-[0.8125rem] text-foreground outline-none"
                  >
                    {LEAD_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === lead.id ? null : lead.id)
                    }
                    className="text-[0.8125rem] text-accent-ink underline underline-offset-4"
                  >
                    {expanded === lead.id ? "Close" : "Details"}
                  </button>
                </div>
              </div>

              {expanded === lead.id ? (
                <LeadDetail
                  lead={lead}
                  busy={busy}
                  onPatch={(update) => void patch(lead, update)}
                  onNote={(note) => void addNote(lead, note)}
                  onDelete={() => void remove(lead)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadDetail({
  lead,
  busy,
  onPatch,
  onNote,
  onDelete,
}: {
  lead: LeadRow;
  busy: boolean;
  onPatch: (update: Record<string, unknown>) => void;
  onNote: (note: string) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState("");
  const [dealValue, setDealValue] = useState(
    lead.deal_value === null ? "" : String(lead.deal_value)
  );
  const [followUp, setFollowUp] = useState(
    lead.follow_up_at
      ? new Date(lead.follow_up_at * 1000).toISOString().slice(0, 10)
      : ""
  );

  return (
    <div className="mt-4 grid gap-5 border-l-2 border-border pl-4 lg:grid-cols-2">
      <div>
        <h3 className="text-eyebrow mb-2 text-foreground">Message</h3>
        <p className="whitespace-pre-wrap text-[0.875rem] leading-relaxed text-muted-text">
          {lead.message ?? "No message was included."}
        </p>

        <dl className="mt-4">
          {[
            ["Telegram", lead.telegram],
            ["Phone", lead.phone],
            ["Referring host", lead.referrer_host],
            ["Medium", lead.medium],
            ["Visitor id", lead.visitor_id],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div
                key={label as string}
                className="flex items-baseline justify-between gap-4 border-b border-border py-1.5 text-[0.8125rem]"
              >
                <dt className="text-muted-text">{label}</dt>
                <dd className="truncate font-geist-mono text-[0.75rem] text-foreground">
                  {value as string}
                </dd>
              </div>
            ))}
        </dl>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`deal-${lead.id}`}
              className="text-meta mb-1.5 block text-muted-text"
            >
              Deal value
            </label>
            <input
              id={`deal-${lead.id}`}
              type="number"
              min="0"
              step="0.01"
              value={dealValue}
              disabled={busy}
              onChange={(event) => setDealValue(event.target.value)}
              onBlur={() =>
                onPatch({
                  dealValue:
                    dealValue === "" ? null : Number(dealValue),
                })
              }
              className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`follow-${lead.id}`}
              className="text-meta mb-1.5 block text-muted-text"
            >
              Follow up on
            </label>
            <input
              id={`follow-${lead.id}`}
              type="date"
              value={followUp}
              disabled={busy}
              onChange={(event) => setFollowUp(event.target.value)}
              onBlur={() =>
                onPatch({
                  followUpAt: followUp
                    ? Math.floor(
                        Date.parse(`${followUp}T00:00:00Z`) / 1000
                      )
                    : null,
                })
              }
              className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`note-${lead.id}`}
            className="text-meta mb-1.5 block text-muted-text"
          >
            Internal note
          </label>
          <textarea
            id={`note-${lead.id}`}
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What you did, what was agreed, what is next."
            className="glass-surface w-full resize-y rounded-lg px-3 py-2 text-[0.875rem] leading-relaxed text-foreground outline-none"
          />
          <button
            type="button"
            disabled={busy || note.trim().length === 0}
            onClick={() => {
              onNote(note);
              setNote("");
            }}
            className="glass-surface mt-2 rounded-lg px-3 py-1.5 text-[0.8125rem] text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save note
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="text-[0.8125rem] text-red-900 underline underline-offset-4"
        >
          Delete this enquiry
        </button>
      </div>
    </div>
  );
}
