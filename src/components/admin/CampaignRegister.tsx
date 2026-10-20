"use client";

import { useEffect, useState } from "react";
import type { CampaignRow } from "@/lib/db/types";

/**
 * The campaign register.
 *
 * The owner's own record of a campaign — its name, channel, objective, service
 * and dates. It carries no metrics: measured performance lives in the
 * observed-traffic table, and the two are never merged.
 */
export function CampaignRegister() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channel: "",
    objective: "",
    service: "",
    notes: "",
  });

  async function load() {
    try {
      const response = await fetch("/api/admin/campaigns");
      if (!response.ok) throw new Error("Could not load the campaigns.");
      const body = (await response.json()) as { campaigns: CampaignRow[] };
      setCampaigns(body.campaigns);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/admin/campaigns");
        if (!response.ok) throw new Error("Could not load the campaigns.");
        const body = (await response.json()) as { campaigns: CampaignRow[] };
        if (cancelled) return;
        setCampaigns(body.campaigns);
      } catch (error) {
        if (!cancelled) setMessage((error as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function create() {
    if (busy || !form.name.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage(body?.error ?? "Could not create the campaign.");
        return;
      }
      setForm({ name: "", channel: "", objective: "", service: "", notes: "" });
      setMessage("Campaign recorded.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    if (!window.confirm("Delete this campaign record?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/campaigns?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <label
            htmlFor="campaign-name"
            className="text-meta mb-1.5 block text-muted-text"
          >
            Name
          </label>
          <input
            id="campaign-name"
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Spring push"
            className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="campaign-channel"
            className="text-meta mb-1.5 block text-muted-text"
          >
            Channel
          </label>
          <select
            id="campaign-channel"
            value={form.channel}
            onChange={(event) =>
              setForm((current) => ({ ...current, channel: event.target.value }))
            }
            className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
          >
            <option value="">Choose…</option>
            <option value="paid_social">Paid social</option>
            <option value="paid_search">Paid search</option>
            <option value="email">Email</option>
            <option value="referral">Referral</option>
            <option value="content">Content</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="campaign-service"
            className="text-meta mb-1.5 block text-muted-text"
          >
            Service
          </label>
          <input
            id="campaign-service"
            type="text"
            value={form.service}
            onChange={(event) =>
              setForm((current) => ({ ...current, service: event.target.value }))
            }
            placeholder="Meta Ads planning"
            className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
          />
        </div>
        <div className="lg:col-span-2">
          <label
            htmlFor="campaign-objective"
            className="text-meta mb-1.5 block text-muted-text"
          >
            Objective
          </label>
          <input
            id="campaign-objective"
            type="text"
            value={form.objective}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                objective: event.target.value,
              }))
            }
            placeholder="What this campaign is for"
            className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={create}
          disabled={busy || !form.name.trim()}
          className="glass-primary rounded-lg px-4 py-2 text-[0.875rem] font-medium"
        >
          Record campaign
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

      {campaigns.length === 0 ? (
        <div className="mt-6 border border-dashed border-border px-6 py-8 text-center">
          <p className="text-[0.875rem] text-muted-text">
            No campaigns recorded yet. Add the ones you run, so their traffic
            and enquiries can be read against them.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="flex flex-wrap items-start justify-between gap-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-medium text-foreground">
                  {campaign.name}
                </p>
                <p className="mt-0.5 text-[0.8125rem] text-muted-text">
                  {campaign.channel?.replace(/_/g, " ") ?? "No channel"}
                  {campaign.service ? ` · ${campaign.service}` : ""}
                </p>
                {campaign.objective ? (
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-text">
                    {campaign.objective}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(campaign.id)}
                disabled={busy}
                className="text-[0.8125rem] text-muted-text underline underline-offset-4 hover:text-foreground"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
