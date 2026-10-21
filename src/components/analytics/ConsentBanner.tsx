"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_COOKIE,
  hasAnalyticsConsent,
  type ConsentLevel,
} from "@/components/analytics/AnalyticsProvider";

/**
 * Consent management.
 *
 * Three levels, chosen by the visitor, stored in a cookie the server can also
 * read:
 *
 * - **essential** — the default. The site works completely; nothing is tracked.
 * - **analytics** — first-party events are recorded, and GA4 may load.
 * - **marketing** — additionally, the Meta Pixel may load so remarketing
 *   audiences can be built.
 *
 * Two things it deliberately does **not** do:
 *
 * 1. It never treats a contact form submission as marketing consent.
 * 2. It never shows a misleading banner — declining is one click, and the
 *    choice is remembered.
 *
 * The legal requirement this implements is a judgement call, not a certainty:
 * the brief asked for the uncertainty to be documented rather than assumed. The
 * default is the conservative one — nothing is tracked until the visitor says
 * yes — which satisfies GDPR/UK consent requirements and is safe elsewhere.
 * If the site is later shown to operate somewhere that requires opt-in for
 * *essential* storage, the levels should be re-examined.
 */

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [level, setLevel] = useState<ConsentLevel>("essential");

  useEffect(() => {
    const stored = document.cookie.match(
      new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`)
    )?.[1];

    // Deferred so the state update is not synchronous inside the effect body:
    // the banner must not appear on a page where a choice was already made.
    const timer = window.setTimeout(() => {
      if (stored) {
        setLevel(stored as ConsentLevel);
        setVisible(false);
      } else {
        setVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function decide(next: ConsentLevel) {
    document.cookie = `${CONSENT_COOKIE}=${next}; path=/; max-age=${THIRTY_DAYS}; samesite=lax`;
    setLevel(next);
    setVisible(false);

    // A reload makes the tracker pick up the new state, so nothing is sent
    // under the old one and nothing is missed under the new one.
    if (next !== "essential") {
      window.location.reload();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Privacy choices"
      /* The card is fixed to the corner, so it has to keep clear of the two
         other fixed things: the mobile dock, and the floating rail.

         Below `lg` the dock is pinned to the bottom, so the card sits above
         it. From `lg` the dock is gone and the rail takes the left edge — so
         the card moves to the right, which also keeps it off the hero's
         paragraph and its "Start a project" button. The right column holds
         the portrait, and the portrait's caption repeats what the "At a
         glance" column already says, so that is the cheapest thing to cover. */
      className="fixed inset-x-3 bottom-[5.75rem] z-40 sm:inset-x-auto sm:bottom-[5.75rem] sm:left-5 sm:max-w-md lg:bottom-5 lg:left-auto lg:right-5 lg:max-w-sm"
    >
      <div className="glass-elevated rounded-xl p-5 shadow-lg">
        <p className="text-eyebrow text-accent-ink">Privacy</p>
        <p className="sr-only">Current choice: {level.replace(/_/g, " ")}</p>
        <p className="mt-3 text-[0.875rem] leading-relaxed text-foreground">
          This site can record how it is used, so I can see which pages and
          campaigns actually bring enquiries. Nothing is recorded until you
          choose. No advertising or analytics tracker loads without your
          consent, and a contact form is never treated as consent.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => decide("marketing")}
            className="cta-primary justify-center text-[0.875rem]"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => decide("analytics")}
            className="cta-secondary justify-center text-[0.875rem]"
          >
            Analytics only
          </button>
          <button
            type="button"
            onClick={() => decide("denied")}
            className="text-[0.8125rem] text-muted-text underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Essential only
          </button>
        </div>

        <p className="mt-4 text-[0.75rem] leading-relaxed text-muted-text">
          Your choice is stored for 30 days. Analytics uses a random
          pseudonymous id with no IP address and no device fingerprinting, and
          is deleted after 180 days.
        </p>
      </div>
    </div>
  );
}

/** True when the visitor has agreed to analytics. Used by the GA4 loader. */
export function analyticsAllowed(): boolean {
  return hasAnalyticsConsent();
}
