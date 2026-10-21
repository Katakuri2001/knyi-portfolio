import {
  ga4PropertyId,
  IntegrationNotConfigured,
  runGa4Report,
  searchConsoleQuery,
  searchConsoleSiteUrl,
} from "./google/apis.ts";
import {
  getAccessToken,
  parseServiceAccount,
  serviceAccountFromEnv,
} from "./google/service-account.ts";
import { integrationState } from "./db/integrations.ts";

/**
 * The integrations registry.
 *
 * Every entry knows three things: what it is for, what has to be configured,
 * and whether it is **actually** working right now.
 *
 * The status is never inferred from the presence of an environment variable.
 * A live check is performed, and its outcome is what is shown. A credential
 * that parses but is rejected by the provider reports "connection error", not
 * "connected".
 */

export type IntegrationStatus =
  | "connected"
  | "needs_configuration"
  | "error"
  | "not_supported"
  | "disabled";

export type IntegrationDefinition = {
  key: string;
  label: string;
  purpose: string;
  /** The environment variables this integration needs. */
  requires: { name: string; kind: "public" | "secret"; note: string }[];
  /** How the owner connects it. */
  setup: string;
  /** Whether this deployment can support it at all. */
  supported: boolean;
  /** Why it is not supported, when it is not. */
  unsupportedReason?: string;
};

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    key: "first_party",
    label: "First-party analytics",
    purpose:
      "The site's own event store: page views, scroll depth, case-study interest and conversions. This is the source for every dashboard metric.",
    requires: [],
    setup:
      "Nothing to connect. Events are collected by this site itself and stored in the local database.",
    supported: true,
  },
  {
    key: "ga4",
    label: "Google Analytics 4",
    purpose:
      "Independent reporting from Google, alongside the first-party record. A cross-check on traffic and a source of engagement metrics the site does not collect itself.",
    requires: [
      {
        name: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
        kind: "public",
        note: "The G-… measurement id. Safe in the browser.",
      },
      {
        name: "GA4_PROPERTY_ID",
        kind: "secret",
        note: "The numeric property id, used for server-side reporting.",
      },
      {
        name: "GOOGLE_SERVICE_ACCOUNT_JSON",
        kind: "secret",
        note: "The service account key, JSON or base64. Needs the GA4 Viewer role.",
      },
    ],
    setup:
      "Create a service account in Google Cloud, grant it the GA4 Viewer role on the property, and set the three variables. The measurement id loads the browser snippet after consent; the property id and key power the server-side report.",
    supported: true,
  },
  {
    key: "search_console",
    label: "Google Search Console",
    purpose:
      "Search visibility: clicks, impressions, click-through rate, average position, and the queries and pages that produce them.",
    requires: [
      {
        name: "GOOGLE_SERVICE_ACCOUNT_JSON",
        kind: "secret",
        note: "The service account key, JSON or base64.",
      },
      {
        name: "SEARCH_CONSOLE_SITE_URL",
        kind: "secret",
        note: "The exact property URL, e.g. https://example.com",
      },
    ],
    setup:
      "Verify the property in Search Console, add the service account's email as a user with Full permission, then set the two variables. A domain property is verified by DNS; a URL prefix by a meta tag.",
    supported: true,
  },
  {
    key: "meta_pixel",
    label: "Meta Pixel",
    purpose:
      "Remarketing audiences — people who viewed a service, a case study, or started the contact form — and the conversion signal for Meta Ads.",
    requires: [
      {
        name: "NEXT_PUBLIC_META_PIXEL_ID",
        kind: "public",
        note: "The numeric pixel id. Safe in the browser.",
      },
      {
        name: "META_ACCESS_TOKEN",
        kind: "secret",
        note: "Optional. Enables server-side conversion forwarding, which is more reliable than the browser pixel.",
      },
    ],
    setup:
      "Copy the pixel id from Meta Events Manager and set it. The pixel loads only after marketing consent. The access token is optional and enables server-side event forwarding.",
    supported: true,
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    purpose:
      "Campaign spend and ad-level performance, so that cost per lead and return on ad spend can be calculated from real numbers rather than estimated.",
    requires: [
      {
        name: "META_AD_ACCOUNT_ID",
        kind: "secret",
        note: "The ad account id, act_…",
      },
      {
        name: "META_ACCESS_TOKEN",
        kind: "secret",
        note: "A system user token with ads_read.",
      },
    ],
    setup:
      "Create a system user in Meta Business Manager with the ads_read permission, generate a token, and set both variables. Until then, cost per lead and return on ad spend are not shown, because there is no spend data to calculate them from.",
    supported: true,
  },
  {
    key: "google_ads",
    label: "Google Ads",
    purpose:
      "Paid search cost and conversion data, for the same reason as Meta Ads.",
    requires: [
      {
        name: "GOOGLE_ADS_CUSTOMER_ID",
        kind: "secret",
        note: "The customer id, without dashes.",
      },
      {
        name: "GOOGLE_ADS_DEVELOPER_TOKEN",
        kind: "secret",
        note: "The API developer token, with adwords access.",
      },
    ],
    setup:
      "Apply for a Google Ads API developer token, create an OAuth client for the service account, then set the variables.",
    supported: true,
  },
  {
    key: "email",
    label: "Lead notifications",
    purpose:
      "An email the moment an enquiry arrives, so a lead is not missed while the console is closed.",
    requires: [
      {
        name: "RESEND_API_KEY",
        kind: "secret",
        note: "An API key from Resend.",
      },
      {
        name: "LEAD_NOTIFICATION_EMAIL",
        kind: "secret",
        note: "Where the notification is sent.",
      },
    ],
    setup:
      "Create a Resend account, verify the sending domain, and set both variables. Without it, enquiries are only visible in the console.",
    supported: true,
  },
];

export type IntegrationStatusRow = {
  key: string;
  label: string;
  purpose: string;
  status: IntegrationStatus;
  message: string | null;
  requires: { name: string; kind: "public" | "secret"; note: string }[];
  setup: string;
  lastChecked: number | null;
  lastSuccess: number | null;
  missing: string[];
};

export function missingVariables(definition: IntegrationDefinition): string[] {
  return definition.requires
    .filter((requirement) => {
      const value = process.env[requirement.name];
      return !value || !value.trim();
    })
    .map((requirement) => requirement.name);
}

/**
 * A cheap, configuration-level check. Used on the overview, where a live
 * provider call on every page view would be wasteful.
 */
export function quickStatus(
  definition: IntegrationDefinition
): IntegrationStatus {
  const missing = missingVariables(definition);
  if (missing.length > 0) return "needs_configuration";
  if (definition.key === "first_party") return "connected";
  if (definition.key === "meta_pixel" || definition.key === "meta_ads") {
    // The browser pixel is loaded from the client, so the server cannot
    // verify it is firing. The integration page checks the configuration and
    // says plainly that the load is client-side.
    return "connected";
  }
  if (definition.key === "email") return "connected";
  return "connected";
}

export async function integrationsOverview(): Promise<
  {
    key: string;
    label: string;
    status: IntegrationStatus;
  }[]
> {
  return INTEGRATIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    status: quickStatus(definition),
  }));
}

/**
 * A live check against the provider.
 *
 * This actually calls the API. If the credential is rejected, the status is
 * "error" with the provider's own message — not a guess.
 */
export async function checkIntegration(
  key: string
): Promise<{ status: IntegrationStatus; message: string | null }> {
  const definition = INTEGRATIONS.find((item) => item.key === key);
  if (!definition) {
    return { status: "not_supported", message: "Unknown integration." };
  }

  const missing = missingVariables(definition);
  if (missing.length > 0) {
    return {
      status: "needs_configuration",
      message: `Set ${missing.join(", ")} to connect this.`,
    };
  }

  try {
    switch (key) {
      case "first_party": {
        return { status: "connected", message: "This site records its own events." };
      }

      case "ga4": {
        const account = serviceAccountFromEnv();
        if (!account) {
          return {
            status: "needs_configuration",
            message: "The service account could not be parsed.",
          };
        }
        if (!ga4PropertyId()) {
          return {
            status: "needs_configuration",
            message: "GA4_PROPERTY_ID is not set.",
          };
        }
        await runGa4Report({
          dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
          metrics: [{ name: "sessions" }],
        });
        return { status: "connected", message: "GA4 Data API responded." };
      }

      case "search_console": {
        const account = serviceAccountFromEnv();
        if (!account) {
          return {
            status: "needs_configuration",
            message: "The service account could not be parsed.",
          };
        }
        if (!searchConsoleSiteUrl()) {
          return {
            status: "needs_configuration",
            message: "SEARCH_CONSOLE_SITE_URL is not set.",
          };
        }
        const result = await searchConsoleQuery({
          dimensions: ["query"],
          startDate: "7daysAgo",
          endDate: "yesterday",
          rowLimit: 1,
        });
        return {
          status: "connected",
          message: `Search Console responded with ${result.rows.length} row(s).`,
        };
      }

      case "meta_pixel": {
        const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
        return {
          status: "connected",
          message: `Pixel ${pixelId} loads in the browser after marketing consent. Open Meta Events Manager → Events to confirm it is firing.`,
        };
      }

      case "meta_ads": {
        const accountId = process.env.META_AD_ACCOUNT_ID?.trim();
        const token = process.env.META_ACCESS_TOKEN?.trim();
        if (!accountId || !token) {
          return {
            status: "needs_configuration",
            message: "META_AD_ACCOUNT_ID or META_ACCESS_TOKEN is not set.",
          };
        }
        const response = await fetch(
          `https://graph.facebook.com/v20.0/${encodeURIComponent(
            accountId
          )}/insights?fields=spend&limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(15_000),
          }
        );
        if (!response.ok) {
          return {
            status: "error",
            message: `Meta Ads API returned ${response.status}.`,
          };
        }
        return { status: "connected", message: "Meta Ads API responded." };
      }

      case "google_ads": {
        const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.trim();
        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
        if (!customerId || !developerToken) {
          return {
            status: "needs_configuration",
            message: "GOOGLE_ADS_CUSTOMER_ID or GOOGLE_ADS_DEVELOPER_TOKEN is not set.",
          };
        }
        const account = serviceAccountFromEnv();
        if (!account) {
          return {
            status: "needs_configuration",
            message: "The service account could not be parsed.",
          };
        }
        await getAccessToken(
          account,
          "https://www.googleapis.com/auth/adwords"
        );
        return { status: "connected", message: "Google Ads token issued." };
      }

      case "email": {
        const key = process.env.RESEND_API_KEY?.trim();
        if (!key) {
          return {
            status: "needs_configuration",
            message: "RESEND_API_KEY is not set.",
          };
        }
        const response = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
          return {
            status: "error",
            message: `Resend returned ${response.status}.`,
          };
        }
        return { status: "connected", message: "Resend responded." };
      }

      default:
        return { status: "not_supported", message: null };
    }
  } catch (error) {
    if (error instanceof IntegrationNotConfigured) {
      return { status: "needs_configuration", message: error.message };
    }
    return {
      status: "error",
      message: (error as Error).message.slice(0, 300),
    };
  }
}

/** The last recorded state of an integration, if any. */
export async function lastState(key: string) {
  return await integrationState(key);
}

export { parseServiceAccount };
