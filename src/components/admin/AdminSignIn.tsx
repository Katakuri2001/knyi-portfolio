"use client";

import { useId, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/paths";

/**
 * The console sign-in.
 *
 * A single password field. The session cookie is HttpOnly and HMAC-signed, so
 * nothing sensitive is held in the browser.
 */
export function AdminSignIn({ configured }: { configured: boolean }) {
  const router = useRouter();
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
        // The layout re-checks the cookie, so a refresh swaps the form for the
        // console.
        router.refresh();
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
      <div className="flex items-center gap-3 border-t border-rule pt-4">
        <Image
          src={withBasePath("/images/mark-k-nyi.png")}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7"
        />
        <span className="text-meta font-medium tracking-[0.18em] text-accent-ink">
          K-Nyi — Console
        </span>
      </div>

      <h1 className="text-title mt-10 text-foreground">
        Console
        <br />
        <span className="text-muted-text">access.</span>
      </h1>

      <p className="text-lede mt-6 text-muted-text">
        Sign in to see how the site is performing and to manage its content.
      </p>

      {!configured ? (
        <div
          role="alert"
          className="mt-10 border-l-2 border-accent-ink/60 py-1 pl-4"
        >
          <p className="figure-caption mb-1.5 text-accent-ink">Setup required</p>
          <p className="text-[0.8125rem] leading-relaxed text-muted-text">
            <code className="font-geist-mono">ADMIN_PASSWORD</code> is not set,
            so there is no password to sign in with. Set it in{" "}
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
            className="glass-surface w-full rounded-lg px-4 py-3 text-[0.9375rem] text-foreground transition-colors duration-200 outline-none placeholder:text-muted-text"
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
            className="glass-primary mt-6 w-full justify-center"
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

      <Link href="/" className="glass-surface mt-12 self-start px-4 py-2">
        Back to the public site
      </Link>
    </main>
  );
}
