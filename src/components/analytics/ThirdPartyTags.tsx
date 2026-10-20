"use client";

import { useEffect } from "react";
import { tracker } from "@/components/analytics/AnalyticsProvider";

/**
 * Consent-gated third-party tags.
 *
 * GA4 and the Meta Pixel are loaded **only** after the visitor has consented.
 * The measurement ids are public identifiers — they are not secrets, and they
 * are inlined into the client bundle by Next from `NEXT_PUBLIC_*` variables.
 * No private credential is ever referenced here.
 *
 * The Meta Pixel is loaded at "marketing" consent. GA4 is loaded at "analytics"
 * consent.
 *
 * Events are sent through `tracker.track()` so the first-party record and the
 * GA4 record stay in step, and so a conversion fires exactly once — the
 * tracker refuses a duplicate key.
 */

export function ThirdPartyTags() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASURE_ID;
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const level = document.cookie.match(
      /(?:^|; )knyi_consent=([^;]*)/
    )?.[1];

    const analyticsAllowed = level === "analytics" || level === "marketing";
    const marketingAllowed = level === "marketing";

    if (gaId && analyticsAllowed && !document.getElementById("ga4-script")) {
      const script = document.createElement("script");
      script.id = "ga4-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script);

      const inline = document.createElement("script");
      inline.id = "ga4-inline";
      inline.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', ${JSON.stringify(gaId)}, { send_page_view: false });
      `;
      document.head.appendChild(inline);
    }

    if (pixelId && marketingAllowed && !document.getElementById("meta-pixel")) {
      const base = document.createElement("script");
      base.id = "meta-pixel";
      base.async = true;
      base.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(base);

      const inline = document.createElement("script");
      inline.id = "meta-pixel-inline";
      inline.textContent = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', ${JSON.stringify(pixelId)});
        fbq('track', 'PageView');
      `;
      document.head.appendChild(inline);
    }
  }, []);

  return null;
}

/**
 * Sends an event to GA4, if it is loaded.
 *
 * Kept separate from the first-party tracker so the two can disagree — if GA4
 * is blocked by an extension, the first-party record is still complete.
 */
export function sendGa4Event(
  name: string,
  params: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag;
  if (!gtag) return;
  gtag("event", name, params);
}

/** Convenience wrapper used by the public components. */
export function trackEvent(
  name: Parameters<typeof tracker.track>[0],
  props: Parameters<typeof tracker.track>[1] = {},
  dedupeKey?: string
) {
  tracker.track(name, props, dedupeKey);
  sendGa4Event(name, props as Record<string, unknown>);
}
