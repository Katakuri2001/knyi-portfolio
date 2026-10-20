"use client";

import { useId, useState, type FormEvent } from "react";
import { trackEvent } from "@/components/analytics/ThirdPartyTags";
import { LEAD_SERVICES } from "@/lib/leads";

/**
 * The public contact form.
 *
 * This is the conversion path the whole console is built around, so it is
 * built like a real form rather than a mailto link:
 *
 * - a real `<label>` for every field, with the error announced in an
 *   `aria-live` region next to the field it belongs to;
 * - the first meaningful interaction fires `contact_form_start` exactly once;
 * - a successful submit fires `contact_form_submit`;
 * - the honeypot field is hidden from people and filled by bots;
 * - nothing is claimed to have been sent unless the server confirmed it.
 */

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "error"; message: string; field?: string | null }
  | { kind: "sent" };

export function ContactForm() {
  const formId = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [started, setStarted] = useState(false);
  const [service, setService] = useState<string>("");

  function markStarted() {
    if (started) return;
    setStarted(true);
    trackEvent("contact_form_start", { path: "/#contact" });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "sending") return;

    setStatus({ kind: "sending" });
    markStarted();

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      telegram: String(data.get("telegram") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
      serviceInterest: String(data.get("serviceInterest") ?? ""),
      company: String(data.get("company") ?? ""),
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        form.reset();
        setService("");
        setStatus({ kind: "sent" });
        trackEvent("contact_form_submit", { path: "/#contact" });
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: string;
        field?: string | null;
      } | null;

      setStatus({
        kind: "error",
        message: body?.error ?? "Something went wrong. Please try again.",
        field: body?.field ?? null,
      });
    } catch {
      setStatus({
        kind: "error",
        message: "Could not reach the server. Please try again.",
      });
    }
  }

  const errorId = `${formId}-error`;
  const fieldError = (name: string) =>
    status.kind === "error" && status.field === name ? status.message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label
            htmlFor={`${formId}-name`}
            className="text-meta mb-1.5 block text-muted-text"
          >
            Name
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            onFocus={markStarted}
            aria-invalid={fieldError("name") ? true : undefined}
            aria-describedby={fieldError("name") ? errorId : undefined}
            className="w-full rounded-sm border border-white/25 bg-white/5 px-3.5 py-3 text-[0.9375rem] text-on-dark transition-colors duration-200 outline-none placeholder:text-on-dark-muted focus:border-accent-primary"
            placeholder="Your name"
          />
        </div>

        <div className="sm:col-span-1">
          <label
            htmlFor={`${formId}-email`}
            className="text-meta mb-1.5 block text-muted-text"
          >
            Email
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            onFocus={markStarted}
            aria-invalid={fieldError("email") ? true : undefined}
            aria-describedby={fieldError("email") ? errorId : undefined}
            className="w-full rounded-sm border border-white/25 bg-white/5 px-3.5 py-3 text-[0.9375rem] text-on-dark transition-colors duration-200 outline-none placeholder:text-on-dark-muted focus:border-accent-primary"
            placeholder="you@company.com"
          />
        </div>

        <div className="sm:col-span-1">
          <label
            htmlFor={`${formId}-telegram`}
            className="text-meta mb-1.5 block text-muted-text"
          >
            Telegram
          </label>
          <input
            id={`${formId}-telegram`}
            name="telegram"
            type="text"
            autoComplete="off"
            onFocus={markStarted}
            className="w-full rounded-sm border border-white/25 bg-white/5 px-3.5 py-3 text-[0.9375rem] text-on-dark transition-colors duration-200 outline-none placeholder:text-on-dark-muted focus:border-accent-primary"
            placeholder="@handle"
          />
        </div>

        <div className="sm:col-span-1">
          <label
            htmlFor={`${formId}-phone`}
            className="text-meta mb-1.5 block text-muted-text"
          >
            Phone
          </label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            onFocus={markStarted}
            className="w-full rounded-sm border border-white/25 bg-white/5 px-3.5 py-3 text-[0.9375rem] text-on-dark transition-colors duration-200 outline-none placeholder:text-on-dark-muted focus:border-accent-primary"
            placeholder="+95 ..."
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`${formId}-service`}
            className="text-meta mb-1.5 block text-muted-text"
          >
            What do you need help with?
          </label>
          <select
            id={`${formId}-service`}
            name="serviceInterest"
            value={service}
            onChange={(event) => {
              setService(event.target.value);
              markStarted();
              if (event.target.value) {
                trackEvent("service_interest", {
                  path: "/#contact",
                  service: event.target.value,
                });
              }
            }}
            className="w-full rounded-sm border border-white/25 bg-white/5 px-3.5 py-3 text-[0.9375rem] text-on-dark transition-colors duration-200 outline-none focus:border-accent-primary"
          >
            <option value="">Choose a service</option>
            {LEAD_SERVICES.map((item) => (
              <option key={item} value={item} className="bg-ink text-on-dark">
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`${formId}-message`}
            className="text-meta mb-1.5 block text-muted-text"
          >
            About the campaign
          </label>
          <textarea
            id={`${formId}-message`}
            name="message"
            rows={5}
            onFocus={markStarted}
            className="w-full resize-y rounded-sm border border-white/25 bg-white/5 px-3.5 py-3 text-[0.9375rem] leading-relaxed text-on-dark transition-colors duration-200 outline-none placeholder:text-on-dark-muted focus:border-accent-primary"
            placeholder="What are you running, what is not working, and what would a good result look like?"
          />
        </div>
      </div>

      {/* Honeypot — hidden from people, filled by bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor={`${formId}-company`}>Company</label>
        <input
          id={`${formId}-company`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <p
        id={errorId}
        role={status.kind === "error" ? "alert" : "status"}
        aria-live="polite"
        className={[
          "mt-5 text-[0.875rem] leading-relaxed",
          status.kind === "error"
            ? "text-accent-primary"
            : status.kind === "sent"
              ? "text-accent-primary"
              : "sr-only",
        ].join(" ")}
      >
        {status.kind === "error"
          ? status.message
          : status.kind === "sent"
            ? "Thank you — your message has been received. I reply to enquiries within a day or two."
            : ""}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="cta-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {status.kind === "sending" ? "Sending…" : "Send enquiry"}
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
        <p className="text-[0.8125rem] leading-relaxed text-on-dark-muted">
          Or email{" "}
          <a
            href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@knyi-portfolio.local"}`}
            className="text-accent-primary underline-offset-4 hover:underline"
            onClick={() => trackEvent("email_click", { path: "/#contact", location: "form" })}
          >
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@knyi-portfolio.local"}
          </a>{" "}
          directly.
        </p>
      </div>
    </form>
  );
}
