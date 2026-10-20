/**
 * Public lead validation.
 *
 * The rules live here so the API route and the tests use exactly the same
 * logic. Nothing is trusted from the request body: field lengths are capped,
 * the email shape is checked, and the spam heuristics are deliberately
 * conservative so a legitimate enquiry is never blocked by them.
 */

export const LEAD_SERVICES = [
  "Meta Ads planning",
  "Media buying",
  "Content strategy",
  "Marketing analysis",
  "Something else",
] as const;

export type LeadService = (typeof LEAD_SERVICES)[number];

export function isLeadService(value: unknown): value is LeadService {
  return (
    typeof value === "string" && (LEAD_SERVICES as readonly string[]).includes(value)
  );
}

export type LeadSubmission = {
  name: string | null;
  email: string | null;
  telegram: string | null;
  phone: string | null;
  message: string | null;
  serviceInterest: string | null;
};

export type LeadValidation =
  | { ok: true; value: LeadSubmission }
  | { ok: false; error: string; field?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Free-mail providers are not blocked — freelancers often use one. */
const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_PHONE = 40;
const MAX_TELEGRAM = 80;
const MAX_MESSAGE = 4000;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** Strips the tags a spam payload would use to break out of a text field. */
function sanitiseText(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/<[^>]*>/g, "").slice(0, 4000);
}

/**
 * A message that is nothing but links is almost always spam. A message with
 * one link and real prose is not — that is how a legitimate brief reads.
 */
function looksLikeSpam(message: string | null): boolean {
  if (!message) return false;
  const links = message.match(/https?:\/\//gi)?.length ?? 0;
  if (links === 0) return false;
  const words = message.split(/\s+/).filter(Boolean).length;
  return links >= 3 || (links >= 1 && words < 12);
}

export function validateLeadSubmission(body: unknown): LeadValidation {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request body." };
  }

  const input = body as Record<string, unknown>;

  // A hidden field that a bot fills in and a human does not see.
  if (typeof input.company === "string" && input.company.trim() !== "") {
    return { ok: false, error: "Submission rejected." };
  }

  const name = text(input.name, MAX_NAME);
  const email = text(input.email, MAX_EMAIL);
  const telegram = text(input.telegram, MAX_TELEGRAM);
  const phone = text(input.phone, MAX_PHONE);
  const message = sanitiseText(text(input.message, MAX_MESSAGE));

  const serviceRaw = text(input.serviceInterest, 80);
  const serviceInterest =
    serviceRaw && isLeadService(serviceRaw) ? serviceRaw : null;

  if (!email && !telegram && !phone) {
    return {
      ok: false,
      error: "Please give an email address, a Telegram handle, or a phone number.",
      field: "email",
    };
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      error: "That email address does not look right.",
      field: "email",
    };
  }

  if (looksLikeSpam(message)) {
    return { ok: false, error: "Submission rejected as spam." };
  }

  return {
    ok: true,
    value: {
      name: sanitiseText(name),
      email: email ? email.toLowerCase() : null,
      telegram,
      phone,
      message,
      serviceInterest,
    },
  };
}
