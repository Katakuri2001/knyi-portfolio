"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/content";

/**
 * The profile editor.
 *
 * Every field here is rendered on the public site. The contact details are
 * still the placeholders they started as, which is why they are editable in
 * one place rather than scattered through the components.
 */
export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: profile.name,
    professionalName: profile.professionalName,
    tagline: profile.tagline,
    positioning: profile.positioning,
    background: profile.background,
    howITick: profile.howITick,
    whatIVALUE: profile.whatIVALUE,
    location: profile.location,
    remoteAvailability: profile.remoteAvailability,
    email: profile.contact.email,
    telegram: profile.contact.telegram,
    phone: profile.contact.phone,
    website: profile.contact.website,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contact: {
            email: form.email,
            telegram: form.telegram,
            phone: form.phone,
            website: form.website,
          },
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        error?: string;
        field?: string | null;
      } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not save the profile.");
        return;
      }

      setMessage("Saved. The public page picks this up on the next publish.");
      router.refresh();
    } catch {
      setMessage("Could not save the profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          id="profile-name"
          label="Full name"
          value={form.name}
          onChange={(value) => set("name", value)}
        />
        <Field
          id="profile-professional-name"
          label="Professional name"
          value={form.professionalName}
          onChange={(value) => set("professionalName", value)}
        />
        <Field
          id="profile-tagline"
          label="Tagline"
          value={form.tagline}
          onChange={(value) => set("tagline", value)}
          hint="The eyebrow above the headline on the hero."
        />
        <Field
          id="profile-location"
          label="Location"
          value={form.location}
          onChange={(value) => set("location", value)}
        />
        <Field
          id="profile-availability"
          label="Availability"
          value={form.remoteAvailability}
          onChange={(value) => set("remoteAvailability", value)}
        />

        <div className="lg:col-span-2">
          <Field
            id="profile-positioning"
            label="Positioning"
            value={form.positioning}
            onChange={(value) => set("positioning", value)}
            hint="The line under the headline, and the footer's closing statement."
          />
        </div>

        <div className="lg:col-span-2">
          <Field
            id="profile-background"
            label="Background"
            value={form.background}
            onChange={(value) => set("background", value)}
            multiline
            hint="The opening paragraph in the About section."
          />
        </div>

        <div className="lg:col-span-2">
          <Field
            id="profile-how-i-think"
            label="How I think"
            value={form.howITick}
            onChange={(value) => set("howITick", value)}
            multiline
          />
        </div>

        <div className="lg:col-span-2">
          <Field
            id="profile-what-i-value"
            label="What I value"
            value={form.whatIVALUE}
            onChange={(value) => set("whatIVALUE", value)}
            multiline
          />
        </div>
      </div>

      <h3 className="text-eyebrow mt-8 mb-3 text-foreground">
        Contact details
      </h3>
      <p className="mb-4 text-[0.8125rem] leading-relaxed text-muted-text">
        These are still the placeholder values from the start. They are live on
        the public site, so they are worth replacing before the site is shared.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          id="profile-email"
          label="Email"
          value={form.email}
          onChange={(value) => set("email", value)}
          hint="The primary contact action on the public site."
        />
        <Field
          id="profile-telegram"
          label="Telegram"
          value={form.telegram}
          onChange={(value) => set("telegram", value)}
        />
        <Field
          id="profile-phone"
          label="Phone"
          value={form.phone}
          onChange={(value) => set("phone", value)}
        />
        <Field
          id="profile-website"
          label="Website"
          value={form.website}
          onChange={(value) => set("website", value)}
          hint="Absolute http or https URL."
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="glass-primary rounded-lg px-4 py-2 text-[0.875rem] font-medium"
        >
          {busy ? "Saving…" : "Save profile"}
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
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  hint,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-meta mb-1.5 block text-muted-text">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="glass-surface w-full resize-y rounded-lg px-3 py-2 text-[0.875rem] leading-relaxed text-foreground outline-none"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
        />
      )}
      {hint ? (
        <p className="mt-1 text-[0.75rem] leading-relaxed text-muted-text">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
