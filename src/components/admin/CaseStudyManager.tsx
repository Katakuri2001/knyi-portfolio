"use client";

import Image from "next/image";
import Link from "next/link";
import { withBasePath } from "@/lib/paths";
import { useState, type FormEvent } from "react";
import type { CaseStudy } from "@/lib/content";
import {
  CaseStudyEditor,
  EMPTY_DRAFT,
  toDraft,
  type Draft,
} from "@/components/admin/CaseStudyEditor";

type Status = { tone: "ok" | "error"; message: string } | null;

/**
 * The console proper: the list of case studies that drive the public Work
 * section, plus create / edit / delete / reorder.
 *
 * Every mutation goes to the existing content API and is followed by
 * `router.refresh()`, which re-reads the JSON on the server — so the list here
 * and the public page always agree.
 */
export function CaseStudyManager({
  initial,
  onSignOut,
}: {
  initial: CaseStudy[];
  onSignOut: () => void;
}) {
  const [studies, setStudies] = useState<CaseStudy[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [reload, setReload] = useState(0);

  const startCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setCreating(true);
    setStatus(null);
  };

  const startEdit = (study: CaseStudy) => {
    setDraft(toDraft(study));
    setEditingId(study.id);
    setCreating(false);
    setStatus(null);
  };

  const closeEditor = () => {
    setEditingId(null);
    setCreating(false);
    setStatus(null);
  };

  async function refreshFromServer() {
    const response = await fetch("/api/content/case-studies", { cache: "no-store" });
    if (response.ok) {
      const next = (await response.json()) as CaseStudy[];
      setStudies(next.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      return next;
    }
    throw new Error("Could not reload the case studies.");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setStatus(null);

    const isNew = creating;
    const payload = isNew ? draft : { ...draft, id: editingId };

    try {
      const response = await fetch("/api/content/case-studies", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setStatus({ tone: "error", message: body?.error ?? "Could not save." });
        return;
      }

      await refreshFromServer();
      setReload((n) => n + 1);
      closeEditor();
      setStatus({
        tone: "ok",
        message: isNew
          ? "Case study created — the public page has been updated."
          : "Changes saved — the public page has been updated.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not save.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove(study: CaseStudy) {
    if (
      !window.confirm(
        `Delete “${study.title}”? This cannot be undone, and any uploaded image for this case study is removed too.`
      )
    ) {
      return;
    }

    setStatus(null);

    try {
      const response = await fetch(
        `/api/content/case-studies?id=${encodeURIComponent(study.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        setStatus({ tone: "error", message: "Could not delete that case study." });
        return;
      }

      await refreshFromServer();
      setReload((n) => n + 1);
      setStatus({
        tone: "ok",
        message: "Case study deleted — the public page has been updated.",
      });
    } catch {
      setStatus({ tone: "error", message: "Could not delete that case study." });
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= studies.length) return;

    const next = [...studies];
    [next[index], next[target]] = [next[target], next[index]];

    setBusy(true);
    setStatus(null);

    try {
      const responses = await Promise.all(
        next.map((study, i) =>
          fetch("/api/content/case-studies", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...study, order: i }),
          })
        )
      );

      if (responses.some((r) => !r.ok)) {
        throw new Error("Could not reorder.");
      }

      await refreshFromServer();
      setReload((n) => n + 1);
      setStatus({ tone: "ok", message: "Order saved." });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not reorder.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setStatus({ tone: "ok", message: `Uploading ${file.name}…` });

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/content/case-studies/upload", {
        method: "POST",
        body,
      });

      const result = (await response.json().catch(() => null)) as {
        path?: string;
        width?: number;
        height?: number;
        error?: string;
      } | null;

      if (!response.ok || !result?.path) {
        setStatus({
          tone: "error",
          message: result?.error ?? "That image could not be uploaded.",
        });
        return;
      }

      setDraft((current: Draft) => ({
        ...current,
        image: result.path ?? null,
        imageWidth: result.width ?? null,
        imageHeight: result.height ?? null,
      }));
      setStatus({
        tone: "ok",
        message: "Image uploaded. Remember to save the case study.",
      });
    } catch {
      setStatus({ tone: "error", message: "That image could not be uploaded." });
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "GET" }).catch(() => {});
    onSignOut();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src={withBasePath("/images/mark-k-nyi.png")}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 flex-none"
              priority
            />
            <span className="flex flex-col">
              <span className="text-[0.8125rem] font-semibold tracking-tight text-accent-secondary">
                K-Nyi — Admin
              </span>
              <span className="text-meta text-muted-text">
                Selected campaigns
              </span>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/#campaigns"
              className="text-[0.8125rem] text-muted-text underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
            >
              View Work section
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-[0.8125rem] text-muted-text underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="rule-ink pt-4">
          <span className="text-meta font-medium tracking-[0.18em] text-accent-ink">
            01
          </span>
          <span className="text-eyebrow ml-4 text-accent-ink">
            Content — selected campaigns
          </span>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="text-title text-foreground">
              Case studies
              <br />
              <span className="text-muted-text">behind the Work section.</span>
            </h1>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <p className="text-lede text-muted-text">
              Saving here writes to <code className="font-geist-mono">content/case-studies.json</code>{" "}
              and regenerates the public page.
            </p>
          </div>
        </div>

        <p
          role={status ? "status" : undefined}
          aria-live="polite"
          className={[
            "mt-8 border-l-2 py-1 pl-4 text-[0.875rem] leading-relaxed",
            status?.tone === "error"
              ? "border-accent-ink text-accent-ink"
              : status
                ? "border-accent-ink/50 text-muted-text"
                : "sr-only border-transparent",
          ].join(" ")}
        >
          {status?.message ?? ""}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <p className="text-eyebrow text-foreground">
            {studies.length} {studies.length === 1 ? "entry" : "entries"}
          </p>
          <button type="button" onClick={startCreate} className="cta-primary">
            New case study
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>

        {creating ? (
          <CaseStudyEditor
            draft={draft}
            onChange={setDraft}
            onCancel={closeEditor}
            onSave={save}
            onUpload={upload}
            onRemoveImage={() =>
              setDraft((d: Draft) => ({ ...d, image: null, imageWidth: null, imageHeight: null }))
            }
            busy={busy}
            error={null}
            isNew
          />
        ) : null}

        <ul>
          {studies.map((study, index) => (
            <li key={study.id} className="border-b border-border">
              <div className="grid gap-4 py-6 md:grid-cols-12 md:items-start md:gap-x-8">
                <div className="md:col-span-2">
                  {study.image ? (
                    <div className="relative aspect-4/3 w-full overflow-hidden border border-border">
                      <Image
                        src={study.image}
                        alt={study.imageAlt || ""}
                        fill
                        unoptimized
                        sizes="220px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-4/3 w-full items-center justify-center border border-border bg-surface-sunken p-2 text-center text-[0.6875rem] leading-snug text-muted-text">
                      No image
                    </div>
                  )}
                </div>

                <div className="md:col-span-7">
                  <p className="text-meta text-accent-ink">{study.platform}</p>
                  <h2 className="mt-1.5 text-subtitle text-foreground">
                    {study.title}
                  </h2>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-text">
                    {[
                      study.adSpend,
                      study.duration,
                      study.audienceGrowth,
                      study.orders,
                      study.averageOrdersPerMonth,
                      study.averageOrderValue,
                    ]
                      .filter(Boolean)
                      .join("  ·  ") || "No figures recorded."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:col-span-3 md:justify-end">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={busy || index === 0}
                      aria-label={`Move ${study.title} earlier`}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-muted-text transition-colors hover:border-accent-ink hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={busy || index === studies.length - 1}
                      aria-label={`Move ${study.title} later`}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-muted-text transition-colors hover:border-accent-ink hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <span aria-hidden="true">↓</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEdit(study)}
                    className="text-[0.8125rem] text-foreground underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(study)}
                    className="text-[0.8125rem] text-muted-text underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingId === study.id ? (
                <CaseStudyEditor
                  draft={draft}
                  onChange={setDraft}
                  onCancel={closeEditor}
                  onSave={save}
                  onUpload={upload}
                  onRemoveImage={() =>
                    setDraft((d) => ({
                      ...d,
                      image: null,
                      imageWidth: null,
                      imageHeight: null,
                    }))
                  }
                  busy={busy}
                  error={null}
                  isNew={false}
                />
              ) : null}
            </li>
          ))}
        </ul>

        {studies.length === 0 && !creating ? (
          <p className="py-10 text-[0.9375rem] text-muted-text">
            No case studies yet. Create the first one above.
          </p>
        ) : null}

        <p className="mt-14 border-t border-border pt-5 text-[0.8125rem] leading-relaxed text-muted-text">
          Figures are shown on the public page exactly as recorded here. If a
          field is left blank, no row is rendered for it — the site never fills
          in a number of its own. Uploaded images are stored in{" "}
          <code className="font-geist-mono">public/uploads/</code> and require a
          writable filesystem.
        </p>

        <span className="sr-only" data-reload={reload} />
      </main>
    </>
  );
}