"use client";

import Image from "next/image";
import { useRef, type ChangeEvent, type FormEvent } from "react";
import type { CaseStudy } from "@/lib/content";

/**
 * One editable case study.
 *
 * Every field maps to a key in `content/case-studies.json`. The optional
 * figures (ad spend, audience, orders…) are left blank when the owner has not
 * supplied them, and the server stores them as `null` — which is what makes the
 * public page render no row for them. There is no default value to fall back
 * on, so nothing can be invented by accident.
 */

export type Draft = Omit<CaseStudy, "id"> & { id?: string };

export const EMPTY_DRAFT: Draft = {
  title: "",
  category: "",
  platform: "Meta advertising",
  adSpend: "",
  duration: "",
  audienceGrowth: "",
  orders: "",
  averageOrdersPerMonth: "",
  averageOrderValue: "",
  scope: "",
  reported: true,
  verified: false,
  methodologyNote:
    "Results are reported or estimated from the available project figures. They have not been independently verified, and advertising-attributed revenue is not claimed.",
  image: "",
  imageAlt: "",
  imageWidth: null,
  imageHeight: null,
  order: null,
};

const toDraft = (study: CaseStudy): Draft => ({
  ...study,
  adSpend: study.adSpend ?? "",
  duration: study.duration ?? "",
  audienceGrowth: study.audienceGrowth ?? "",
  orders: study.orders ?? "",
  averageOrdersPerMonth: study.averageOrdersPerMonth ?? "",
  averageOrderValue: study.averageOrderValue ?? "",
  scope: study.scope ?? "",
  methodologyNote: study.methodologyNote ?? "",
  image: study.image ?? "",
  imageAlt: study.imageAlt ?? "",
  imageWidth: study.imageWidth ?? null,
  imageHeight: study.imageHeight ?? null,
  order: study.order ?? null,
});

const FIELDS: {
  key: keyof Draft;
  label: string;
  placeholder?: string;
  hint?: string;
  span?: boolean;
}[] = [
  { key: "title", label: "Title", placeholder: "Modular Building Business" },
  { key: "category", label: "Category", placeholder: "Defaults to the title" },
  { key: "platform", label: "Platform", placeholder: "Meta advertising" },
  { key: "adSpend", label: "Ad spend", placeholder: "US$160" },
  { key: "duration", label: "Duration", placeholder: "2 months" },
  { key: "audienceGrowth", label: "Audience growth", placeholder: "0 → ~300 followers" },
  { key: "orders", label: "Orders", placeholder: "1 order" },
  { key: "averageOrdersPerMonth", label: "Avg orders / month", placeholder: "~50" },
  { key: "averageOrderValue", label: "Avg order value", placeholder: "US$3" },
  {
    key: "scope",
    label: "Scope",
    placeholder: "content strategy, research, positioning, media planning…",
    span: true,
  },
];

export function CaseStudyEditor({
  draft,
  onChange,
  onCancel,
  onSave,
  onUpload,
  onRemoveImage,
  busy,
  error,
  isNew,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpload: (file: File) => void;
  onRemoveImage: () => void;
  busy: boolean;
  error: string | null;
  isNew: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: keyof Draft, value: string | boolean) {
    onChange({ ...draft, [key]: value } as Draft);
  }

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    // Allow re-picking the same file after a failed upload.
    event.target.value = "";
  }

  const previewRatio =
    draft.image && draft.imageWidth && draft.imageHeight
      ? `${draft.imageWidth} / ${draft.imageHeight}`
      : "4 / 3";

  return (
    <form onSubmit={onSave} className="mt-6 bg-surface-sunken p-5 md:p-7">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
        <h3 className="text-eyebrow text-foreground">
          {isNew ? "New case study" : `Editing — ${draft.title || "Untitled"}`}
        </h3>
        <span className="text-meta text-muted-text">
          {isNew ? "Not saved yet" : draft.id}
        </span>
      </div>

      {/* --- Image --- */}
      <div className="mt-6 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="text-eyebrow mb-2 text-foreground">Campaign image</p>
          <div
            className="relative w-full overflow-hidden border border-border bg-background"
            style={{ aspectRatio: previewRatio }}
          >
            {draft.image ? (
              <Image
                src={draft.image}
                alt={draft.imageAlt || "Uploaded campaign image preview"}
                fill
                unoptimized
                sizes="320px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-[0.8125rem] leading-relaxed text-muted-text">
                No image — the Work section will use its editorial figure.
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <label className="glass-surface cursor-pointer px-4 py-2 text-[0.8125rem]">
              {draft.image ? "Replace image" : "Upload image"}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={pickFile}
                className="sr-only"
              />
            </label>
            {draft.image ? (
              <button
                type="button"
                onClick={onRemoveImage}
                className="text-[0.8125rem] text-muted-text underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
              >
                Remove
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-text">
            JPG, PNG, WebP or AVIF, up to 6 MB. Optional — the section still
            reads without one.
          </p>

          {draft.image ? (
            <div className="mt-4">
              <label
                htmlFor={`alt-${isNew ? "new" : draft.id}`}
                className="text-meta mb-1.5 block text-muted-text"
              >
                Image description (alt text)
              </label>
              <input
                id={`alt-${isNew ? "new" : draft.id}`}
                type="text"
                value={draft.imageAlt ?? ""}
                placeholder="Screenshot of the campaign ad set"
                onChange={(event) => set("imageAlt", event.target.value)}
                className="glass-surface w-full rounded-lg px-3 py-2 text-[0.875rem] text-foreground transition-colors duration-200 outline-none placeholder:text-muted-text/70"
              />
              <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-text">
                Describe what the image shows. Left blank, the page uses a
                neutral description instead.
              </p>
            </div>
          ) : null}
        </div>

        {/* --- Text fields --- */}
        <div className="md:col-span-8">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const id = `${field.key}-${isNew ? "new" : draft.id}`;
              const wide = field.span;
              return (
                <div key={field.key} className={wide ? "sm:col-span-2" : undefined}>
                  <label
                    htmlFor={id}
                    className="text-meta mb-1.5 block text-muted-text"
                  >
                    {field.label}
                  </label>
                  <input
                    id={id}
                    type="text"
                    value={(draft[field.key] as string) ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      set(field.key, event.target.value)
                    }
                    className="glass-surface w-full rounded-lg px-3 py-2.5 text-[0.9375rem] text-foreground transition-colors duration-200 outline-none placeholder:text-muted-text/70"
                  />
                </div>
              );
            })}

            <div className="sm:col-span-2">
              <label
                htmlFor={`note-${isNew ? "new" : draft.id}`}
                className="text-meta mb-1.5 block text-muted-text"
              >
                Methodology note
              </label>
              <textarea
                id={`note-${isNew ? "new" : draft.id}`}
                rows={3}
                value={draft.methodologyNote ?? ""}
                onChange={(event) => set("methodologyNote", event.target.value)}
                className="glass-surface w-full resize-y rounded-lg px-3 py-2.5 text-[0.875rem] leading-relaxed text-foreground transition-colors duration-200 outline-none"
              />
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="text-meta mb-2 text-muted-text">
                Claim status
              </legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-[0.875rem] text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.reported)}
                    onChange={(event) => set("reported", event.target.checked)}
                    className="h-4 w-4 accent-[color:var(--color-accent-ink)]"
                  />
                  Reported figures
                </label>
                <label className="flex items-center gap-2 text-[0.875rem] text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.verified)}
                    onChange={(event) => set("verified", event.target.checked)}
                    className="h-4 w-4 accent-[color:var(--color-accent-ink)]"
                  />
                  Independently verified
                </label>
              </div>
              <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-text">
                Leave <em>verified</em> unchecked unless a third party has
                confirmed the numbers. The page labels every figure as reported.
              </p>
            </fieldset>
          </div>
        </div>
      </div>

      <p
        role={error ? "alert" : undefined}
        aria-live="polite"
        className={[
          "mt-5 text-[0.8125rem] leading-relaxed",
          error ? "text-accent-ink" : "sr-only",
        ].join(" ")}
      >
        {error ?? ""}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-5">
        <button
          type="submit"
          disabled={busy || !draft.title.trim()}
          className="glass-primary"
        >
          {busy ? "Saving…" : isNew ? "Create case study" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="glass-surface px-4 py-2">
          Cancel
        </button>
      </div>
    </form>
  );
}

export { toDraft };