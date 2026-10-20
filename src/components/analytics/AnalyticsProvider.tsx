"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  isAnalyticsEventName,
  type AnalyticsEventName,
  type EventProps,
} from "@/lib/analytics/events";

/**
 * The first-party tracker.
 *
 * A small, deliberately boring client. It:
 *
 * - sends an allowlisted event name with an allowlisted set of properties;
 * - never sends a name, an email, a phone number or a message — the property
 *   schema does not have a field that could hold one, and the server rejects
 *   a payload that tries;
 * - does not fire on every render — a page view is sent once per path, and
 *   the component tracks the last path it sent;
 * - batches with `sendBeacon` on unload so a visitor who leaves immediately is
 *   still counted.
 *
 * Consent: nothing is sent at all until the visitor has consented to
 * analytics. The consent decision lives in a cookie read by the server and by
 * this module.
 */

export const CONSENT_COOKIE = "knyi_consent";

export type ConsentLevel = "essential" | "analytics" | "marketing" | "denied";

const ENDPOINT = "/api/track";

export function readConsent(): ConsentLevel {
  if (typeof document === "undefined") return "essential";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`)
  );
  const value = match?.[1];
  if (
    value === "analytics" ||
    value === "marketing" ||
    value === "denied"
  ) {
    return value;
  }
  return "essential";
}

export function hasAnalyticsConsent(): boolean {
  const level = readConsent();
  return level === "analytics" || level === "marketing";
}

/** The tracker instance, shared by the whole page. */
class Tracker {
  private queue: {
    name: AnalyticsEventName;
    props: EventProps;
    dedupeKey?: string;
  }[] = [];

  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastPath: string | null = null;
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;
    window.addEventListener("pagehide", this.flushBeacon);
  }

  track(
    name: AnalyticsEventName,
    props: EventProps = {},
    dedupeKey?: string
  ) {
    if (!hasAnalyticsConsent()) return;
    if (!isAnalyticsEventName(name)) return;

    this.queue.push({ name, props, dedupeKey });
    this.schedule();
  }

  private schedule() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, 1200);
  }

  private payload() {
    const path = window.location.pathname + window.location.search;
    return {
      events: this.queue.map((event) => ({
        name: event.name,
        props: { ...event.props, path },
        dedupeKey: event.dedupeKey,
      })),
      path,
      referrer: document.referrer || null,
      width: window.innerWidth,
      mobile: window.matchMedia("(max-width: 640px)").matches,
      userAgent: navigator.userAgent,
    };
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    if (!hasAnalyticsConsent()) {
      this.queue = [];
      return;
    }
    const events = this.queue;
    this.queue = [];
    try {
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.payloadWith(events)),
        keepalive: true,
      });
    } catch {
      // A failed analytics request must never interrupt the page.
    }
  }

  private payloadWith(
    events: { name: AnalyticsEventName; props: EventProps; dedupeKey?: string }[]
  ) {
    const path = window.location.pathname + window.location.search;
    return {
      events: events.map((event) => ({
        name: event.name,
        props: { ...event.props, path },
        dedupeKey: event.dedupeKey,
      })),
      path,
      referrer: document.referrer || null,
      width: window.innerWidth,
      mobile: window.matchMedia("(max-width: 640px)").matches,
      userAgent: navigator.userAgent,
    };
  }

  private flushBeacon = () => {
    if (this.queue.length === 0) return;
    if (!hasAnalyticsConsent()) return;
    const blob = new Blob([JSON.stringify(this.payload())], {
      type: "application/json",
    });
    navigator.sendBeacon(ENDPOINT, blob);
    this.queue = [];
  };

  /** Called when the route changes, to send one page view per path. */
  pageViewed(path: string) {
    if (this.lastPath === path) return;
    this.lastPath = path;
    this.track("page_view", { path });
  }
}

export const tracker = new Tracker();

/**
 * Scroll depth, measured once per threshold.
 *
 * 25 / 50 / 75 / 100 — a visitor who reaches 100% has seen the whole page.
 */
export function observeScrollDepth(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const thresholds = [25, 50, 75, 100];
  const seen = new Set<number>();

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = Math.min(
      100,
      Math.round(((window.scrollY / scrollable) * 100))
    );
    for (const threshold of thresholds) {
      if (percent >= threshold && !seen.has(threshold)) {
        seen.add(threshold);
        tracker.track("scroll_depth", { depth: threshold });
      }
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

/**
 * The provider. It sends one page view per path and wires the scroll depth
 * observer. It is deliberately a no-op before consent is granted.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    tracker.start();
    const stop = observeScrollDepth();
    return stop;
  }, []);

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    const query = searchParams?.toString();
    tracker.pageViewed(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
