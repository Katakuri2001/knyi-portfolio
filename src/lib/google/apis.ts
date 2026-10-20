import {
  getAccessToken,
  serviceAccountFromEnv,
  type ServiceAccount,
} from "./service-account.ts";

export { serviceAccountFromEnv };

/**
 * GA4 Data API (server side) and Search Console API.
 *
 * Both are plain REST calls with a bearer token obtained from the service
 * account. Neither is a mock: when the credentials are absent the caller gets
 * an honest "not configured" state, and when they are present the numbers come
 * from Google.
 */

export type Ga4Row = {
  dimensionValues: string[];
  metricValues: string[];
};

export type Ga4Report = {
  headers: { name: string; type: string }[];
  rows: Ga4Row[];
  totals?: Ga4Row[];
  metadata?: { currency?: string; timeZone?: string };
};

const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const SEARCH_CONSOLE = "https://searchconsole.googleapis.com/webmasters/v3";

export function ga4PropertyId(): string | null {
  return process.env.GA4_PROPERTY_ID?.trim() || null;
}

export function searchConsoleSiteUrl(): string | null {
  return process.env.SEARCH_CONSOLE_SITE_URL?.trim() || null;
}

async function authorisedFetch(
  account: ServiceAccount,
  url: string,
  init: RequestInit
): Promise<Response> {
  const token = await getAccessToken(account);
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });
}

/**
 * Runs a GA4 report.
 *
 * `dimensions` and `metrics` are the GA4 field names. The request body is
 * passed through unchanged so the console can ask for exactly the report it
 * needs without this module inventing a shape.
 */
export async function runGa4Report(
  body: Record<string, unknown>
): Promise<Ga4Report> {
  const account = serviceAccountFromEnv();
  const property = ga4PropertyId();

  if (!account) {
    throw new IntegrationNotConfigured(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set."
    );
  }
  if (!property) {
    throw new IntegrationNotConfigured("GA4_PROPERTY_ID is not set.");
  }

  const response = await authorisedFetch(
    account,
    `${DATA_API}/properties/${encodeURIComponent(property)}:runReport`,
    { method: "POST", body: JSON.stringify(body) }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `GA4 Data API error (${response.status}): ${detail.slice(0, 300)}`
    );
  }

  return (await response.json()) as Ga4Report;
}

/** A GA4 report, or `null` when GA4 is not connected. */
export async function ga4ReportOrNull(
  body: Record<string, unknown>
): Promise<Ga4Report | null> {
  try {
    return await runGa4Report(body);
  } catch {
    return null;
  }
}

export type SearchConsoleRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchConsoleResponse = {
  rows: SearchConsoleRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number } | null;
};

/**
 * Queries the Search Console search analytics API.
 *
 * `dimensions` are the API's own dimension names (`query`, `page`, `country`,
 * `device`), and `startDate`/`endDate` are `YYYY-MM-DD` strings.
 */
export async function searchConsoleQuery(options: {
  dimensions: string[];
  startDate: string;
  endDate: string;
  rowLimit?: number;
}): Promise<SearchConsoleResponse> {
  const account = serviceAccountFromEnv();
  const siteUrl = searchConsoleSiteUrl();

  if (!account) {
    throw new IntegrationNotConfigured(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set."
    );
  }
  if (!siteUrl) {
    throw new IntegrationNotConfigured("SEARCH_CONSOLE_SITE_URL is not set.");
  }

  const response = await authorisedFetch(
    account,
    `${SEARCH_CONSOLE}/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`,
    {
      method: "POST",
      body: JSON.stringify({
        startDate: options.startDate,
        endDate: options.endDate,
        dimensions: options.dimensions,
        rowLimit: options.rowLimit ?? 100,
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Search Console error (${response.status}): ${detail.slice(0, 300)}`
    );
  }

  const body = (await response.json()) as {
    rows?: {
      keys?: string[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    }[];
  };

  const rows: SearchConsoleRow[] = (body.rows ?? []).map((row) => ({
    keys: row.keys ?? [],
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));

  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);

  return {
    rows,
    totals: rows.length
      ? {
          clicks,
          impressions,
          ctr: impressions > 0 ? clicks / impressions : 0,
          position:
            rows.reduce((sum, row) => sum + row.position, 0) / rows.length,
        }
      : null,
  };
}

/** Raised when an integration is simply not configured. */
export class IntegrationNotConfigured extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationNotConfigured";
  }
}
