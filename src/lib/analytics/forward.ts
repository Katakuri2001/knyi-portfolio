import { getVisitor } from "../db/events.ts";

/**
 * Server-side conversion forwarding.
 *
 * When the Meta Pixel is configured with a server-side access token, a stored
 * lead is reported to it so remarketing audiences can be built. Nothing is
 * sent that identifies a person: the lead's name, email, phone and message
 * never leave the database — only the event id, the campaign and the source.
 *
 * GA4 needs no server-side path here. Its Measurement Protocol secret is for
 * sending events from a *server* that already holds a GA4 client id, and this
 * console does not — the browser snippet sends the conversion with the real
 * client id, which is the correct mechanism.
 *
 * A failure here is never surfaced to the visitor: the lead is already
 * stored, and a reporting failure must not look like a failed submission.
 */

export type ForwardableConversion = {
  leadId: string;
  visitorId: string | null;
  source: string | null;
  campaign: string | null;
  service: string | null;
};

const META_ENDPOINT = "https://graph.facebook.com/v20.0/{pixelId}/events";

export async function forwardLeadConversion(
  conversion: ForwardableConversion
): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();

  if (!pixelId || !accessToken) return;

  // Advertising storage requires marketing consent. A lead submission is not
  // consent, so the visitor's recorded state decides.
  if (conversion.visitorId) {
    const visitor = getVisitor(conversion.visitorId);
    if (visitor && visitor.consent !== "marketing") return;
  }

  await fetch(META_ENDPOINT.replace("{pixelId}", encodeURIComponent(pixelId)), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: conversion.leadId,
          custom_data: {
            campaign: conversion.campaign ?? undefined,
            source: conversion.source ?? undefined,
            content_name: conversion.service ?? undefined,
          },
        },
      ],
      access_token: accessToken,
    }),
    signal: AbortSignal.timeout(10_000),
  });
}
