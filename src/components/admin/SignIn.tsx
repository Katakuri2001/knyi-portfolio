"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

/**
 * Sign-in.
 *
 * The same editorial language as the public site — a hairline-ruled card on the
 * paper canvas — but a form rather than a composition. The password field is a
 * real `<label>`-bound input, errors land next to the field in an
 * `aria-live` region, and the submit button is disabled while the request is in
 * flight so it cannot be double-fired.
 */
export function SignIn({
  configured,
  onSignedIn,
}: {
  configured: boolean;
  onSignedIn: () => void;
}) {
  const fieldId = useId();
  const errorId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onSignedIn();
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Could not sign in. Try again.");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
      <div className="rule-ink pt-4">
        <span className="text-meta font-medium tracking-[0.18em] text-accent-ink">
          K-Nyi
        </span>
      </div>

      <h1 className="text-title mt-10 text-foreground">
        Console
        <br />
        <span className="text-muted-text">access.</span>
      </h1>

      <p className="text-lede mt-6 text-muted-text">
        Sign in to edit the case studies behind the Work section.
      </p>

      {!configured ? (
        <div
          role="alert"
          className="mt-10 border-l-2 border-accent-ink/60 py-1 pl-4"
        >
          <p className="figure-caption mb-1.5 text-accent-ink">
            Setup required
          </p>
          <p className="text-[0.8125rem] leading-relaxed text-muted-text">
            <code className="font-geist-mono">ADMIN_PASSWORD</code> is not set,
            so there is no password to sign in with. Set it in your{" "}
            <code className="font-geist-mono">.env.local</code> and restart the
            server.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-10">
          <label
            htmlFor={fieldId}
            className="text-eyebrow mb-2 block text-foreground"
          >
            Admin password
          </label>
          <input
            id={fieldId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-[0.9375rem] text-foreground transition-colors duration-200 outline-none placeholder:text-muted-text focus:border-accent-ink"
            placeholder="••••••••••••"
          />

          <p
            id={errorId}
            role={error ? "alert" : undefined}
            aria-live="polite"
            className={[
              "mt-3 text-[0.8125rem] leading-relaxed",
              error ? "text-accent-ink" : "sr-only",
            ].join(" ")}
          >
            {error ?? ""}
          </p>

          <button
            type="submit"
            disabled={busy || password.length === 0}
            className="cta-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
          >
            {busy ? "Checking…" : "Sign in"}
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 8h12M9 3l5 5-5 5" />
            </svg>
          </button>
        </form>
      )}

      <Link href="/" className="cta-secondary mt-12 self-start">
        Back to the public site
      </Link>
    </main>
  );
}