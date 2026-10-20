"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SeoMetadataRow } from "@/lib/db/types";
import type { PublicRoute } from "@/lib/seo/public-routes";

/**
 * The per-page metadata editor.
 *
 * Whatever is saved here is read by the public page's `generateMetadata`, so
 * the change is real: the rendered `<title>`, description, canonical, Open
 * Graph tags and robots directive all follow. Deleting an override restores
 * the code defaults.
 */
export function SeoMetadataEditor({
  routes,
  overrides,
}: {
  routes: PublicRoute[];
  overrides: SeoMetadataRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    seoTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    noindex: false,
    confirmNoindex: false,
  });

  function startEdit(path: string) {
    const existing = overrides.find((row) => row.path === path);
    setForm({
      seoTitle: existing?.seo_title ?? "",
      metaDescription: existing?.meta_description ?? "",
      canonicalUrl: existing?.canonical_url ?? "",
      ogTitle: existing?.og_title ?? "",
      ogDescription: existing?.og_description ?? "",
      ogImage: existing?.og_image ?? "",
      noindex: Boolean(existing?.noindex),
      confirmNoindex: false,
    });
    setEditing(path);
    setMessage(null);
  }

  async function save(path: string) {
    if (saving) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, ...form }),
      });

      const body = (await response.json().catch(() => null)) as {
        error?: string;
        field?: string | null;
      } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Could not save the metadata.");
        return;
      }

      setEditing(null);
      setMessage("Saved. The public page uses these values now.");
      router.refresh();
    } catch {
      setMessage("Could not save the metadata.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(path: string) {
    if (saving) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/seo?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      setEditing(null);
      setMessage("Override removed. The code defaults apply again.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-[0.8125rem]">
          <thead>
            <tr className="border-b border-border text-meta text-muted-text">
              <th className="py-2 pr-4 font-medium">Path</th>
              <th className="py-2 pr-4 font-medium">SEO title</th>
              <th className="py-2 pr-4 font-medium">Description</th>
              <th className="py-2 pr-4 font-medium">Indexing</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => {
              const existing = overrides.find((row) => row.path === route.path);
              const isEditing = editing === route.path;

              return (
                <>
                  <tr key={route.path} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-geist-mono text-[0.75rem] text-foreground">
                      {route.path}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-text">
                      {existing?.seo_title ?? (
                        <span className="text-muted-text/70">default</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-text">
                      {existing?.meta_description ?? (
                        <span className="text-muted-text/70">default</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-text">
                      {existing?.noindex ? "noindex" : "index, follow"}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          isEditing ? setEditing(null) : startEdit(route.path)
                        }
                        className="text-[0.8125rem] text-accent-ink underline underline-offset-4"
                      >
                        {isEditing ? "Cancel" : "Edit"}
                      </button>
                    </td>
                  </tr>

                  {isEditing ? (
                    <tr key={`${route.path}-form`} className="border-b border-border bg-surface-sunken/40">
                      <td colSpan={5} className="px-2 py-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="SEO title"
                            value={form.seoTitle}
                            maxLength={160}
                            onChange={(value) =>
                              setForm((current) => ({ ...current, seoTitle: value }))
                            }
                            hint="Around 60 characters. Shown as the search result title."
                          />
                          <Field
                            label="Meta description"
                            value={form.metaDescription}
                            maxLength={320}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                metaDescription: value,
                              }))
                            }
                            hint="Around 160 characters. Shown as the snippet."
                          />
                          <Field
                            label="Canonical URL"
                            value={form.canonicalUrl}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                canonicalUrl: value,
                              }))
                            }
                            hint="Absolute https URL. Leave blank to use the default."
                          />
                          <Field
                            label="Open Graph title"
                            value={form.ogTitle}
                            maxLength={160}
                            onChange={(value) =>
                              setForm((current) => ({ ...current, ogTitle: value }))
                            }
                            hint="The headline on a shared link."
                          />
                          <Field
                            label="Open Graph description"
                            value={form.ogDescription}
                            maxLength={320}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                ogDescription: value,
                              }))
                            }
                            hint="The text under a shared link."
                          />
                          <Field
                            label="Social preview image"
                            value={form.ogImage}
                            onChange={(value) =>
                              setForm((current) => ({ ...current, ogImage: value }))
                            }
                            hint="Site-relative path, e.g. /images/portrait-k-nyi.jpg"
                          />
                        </div>

                        <label className="mt-4 flex items-start gap-2.5 text-[0.8125rem] text-foreground">
                          <input
                            type="checkbox"
                            checked={form.noindex}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                noindex: event.target.checked,
                                confirmNoindex: false,
                              }))
                            }
                            className="mt-0.5 h-4 w-4 accent-[color:var(--color-accent-ink)]"
                          />
                          <span>
                            Remove this page from search results
                            {route.path === "/" ? (
                              <span className="mt-1 block text-[0.75rem] text-muted-text">
                                This is the whole site. It needs a second
                                confirmation, and it will hide every page from
                                Google.
                              </span>
                            ) : null}
                          </span>
                        </label>

                        {route.path === "/" && form.noindex ? (
                          <label className="mt-3 flex items-center gap-2.5 text-[0.8125rem] text-red-900">
                            <input
                              type="checkbox"
                              checked={form.confirmNoindex}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  confirmNoindex: event.target.checked,
                                }))
                              }
                              className="mt-0.5 h-4 w-4 accent-[color:var(--color-accent-ink)]"
                            />
                            Yes, I understand this removes the whole site from
                            search results.
                          </label>
                        ) : null}

                        <div className="mt-5 flex flex-wrap items-center gap-4">
                          <button
                            type="button"
                            onClick={() => save(route.path)}
                            disabled={saving}
                            className="glass-primary rounded-lg px-4 py-2 text-[0.875rem] font-medium"
                          >
                            {saving ? "Saving…" : "Save metadata"}
                          </button>
                          {existing ? (
                            <button
                              type="button"
                              onClick={() => remove(route.path)}
                              disabled={saving}
                              className="text-[0.8125rem] text-muted-text underline underline-offset-4 hover:text-foreground"
                            >
                              Remove override
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={[
          "mt-4 text-[0.8125rem]",
          message ? "text-foreground" : "sr-only",
        ].join(" ")}
      >
        {message ?? ""}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
  maxLength?: number;
}) {
  const id = `seo-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="text-meta mb-1.5 block text-muted-text">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground outline-none"
      />
      <p className="mt-1 text-[0.75rem] text-muted-text">{hint}</p>
    </div>
  );
}
