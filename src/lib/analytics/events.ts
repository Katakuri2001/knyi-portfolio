/**
 * The event catalogue.
 *
 * Every tracked event is named here, with the properties it is allowed to
 * carry. The tracker, the ingestion endpoint and the database all validate
 * against this one list, so an event name that is not on it cannot be stored
 * by any path.
 *
 * ## Privacy
 *
 * Property schemas are an **allowlist**, not a type. Anything not named in a
 * schema is dropped, and the schemas contain no field that could hold a name,
 * an email address, a phone number, a message body, a URL query string, a
 * password or a session token.
 *
 * The `forbidden` list is a second line of defence: if a caller tries to send
 * a key that looks like personal data, the whole payload is rejected rather
 * than partially stored.
 */

export const ANALYTICS_EVENTS = [
  "page_view",
  "scroll_depth",
  "case_study_view",
  "contact_cta_click",
  "email_click",
  "external_link_click",
  "contact_form_start",
  "contact_form_submit",
  "lead_created",
  "qualified_lead",
  "service_interest",
  "campaign_landing_view",
  "case_study_cta_click",
  "outbound_conversion",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

const EVENT_NAME_SET = new Set<string>(ANALYTICS_EVENTS);

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && EVENT_NAME_SET.has(value);
}

/**
 * Property keys that are never accepted, whatever the event.
 *
 * A key is rejected if it looks like personal data, a credential, or a raw
 * URL (which is how PII usually leaks — in query strings).
 */
const FORBIDDEN_KEY_PATTERN =
  /(name|email|phone|message|body|subject|comment|note|password|passwd|secret|token|cookie|authorization|ip|address|useragent|user_agent|query|url|href)/i;

/** Property schemas. `undefined` means "no properties beyond the common ones". */
export const EVENT_PROPS: Record<AnalyticsEventName, readonly string[]> = {
  page_view: ["path", "referrer_host", "channel", "utm_source", "utm_medium", "utm_campaign"],
  scroll_depth: ["path", "depth", "channel"],
  case_study_view: ["path", "case_study_id", "case_study_title", "channel"],
  contact_cta_click: ["path", "location", "channel"],
  email_click: ["path", "location", "channel"],
  external_link_click: ["path", "location", "host", "channel"],
  contact_form_start: ["path", "channel"],
  contact_form_submit: ["path", "channel", "service_interest"],
  lead_created: ["path", "channel", "service_interest", "campaign"],
  qualified_lead: ["path", "channel", "service_interest", "campaign"],
  service_interest: ["path", "service", "channel"],
  campaign_landing_view: ["path", "utm_source", "utm_medium", "utm_campaign", "channel"],
  case_study_cta_click: ["path", "case_study_id", "case_study_title", "channel"],
  outbound_conversion: ["path", "kind", "channel"],
};

/** Events that represent a business outcome. */
export const CONVERSION_EVENTS = {
  lead_created: "lead_created",
  qualified_lead: "qualified_lead",
  outbound_conversion: "outbound_conversion",
} as const;

export type ConversionKind = (typeof CONVERSION_EVENTS)[keyof typeof CONVERSION_EVENTS];

export function conversionFor(name: AnalyticsEventName): ConversionKind | null {
  return (CONVERSION_EVENTS as Record<string, ConversionKind>)[name] ?? null;
}

/** Property values are short strings or small numbers. */
export type EventPropValue = string | number;

export type EventProps = Record<string, EventPropValue>;

export type ValidatedEvent = {
  name: AnalyticsEventName;
  props: EventProps;
};

/**
 * Validates and normalises one event.
 *
 * Returns `null` when the event is not allowed, when a property key is
 * forbidden, or when a value is the wrong shape. The caller treats `null` as
 * "reject the event".
 */
export function validateEvent(
  name: unknown,
  rawProps: unknown
): ValidatedEvent | null {
  if (!isAnalyticsEventName(name)) return null;

  const allowed = new Set(EVENT_PROPS[name]);
  const props: EventProps = {};

  if (rawProps && typeof rawProps === "object" && !Array.isArray(rawProps)) {
    for (const [key, value] of Object.entries(rawProps as Record<string, unknown>)) {
      if (FORBIDDEN_KEY_PATTERN.test(key)) return null;
      if (!allowed.has(key)) continue;

      if (typeof value === "string") {
        if (value.length > 200) continue;
        props[key] = value;
      } else if (typeof value === "number") {
        if (!Number.isFinite(value)) continue;
        props[key] = value;
      }
      // Anything else (objects, arrays, booleans, null) is dropped rather
      // than stringified — that is where PII would sneak in.
    }
  }

  return { name, props };
}

/** Maximum accepted payload size for a single event, in bytes. */
export const MAX_EVENT_PAYLOAD_BYTES = 4096;

/** Maximum accepted events in one request. */
export const MAX_EVENTS_PER_REQUEST = 25;
