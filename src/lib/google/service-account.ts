import { createSign } from "node:crypto";

/**
 * Google service-account authentication, implemented directly against the
 * token endpoint with Node's built-in crypto.
 *
 * No `googleapis` client library: it is a very large dependency, and the two
 * APIs this console needs (GA4 Data API and Search Console) are two HTTP
 * calls each once a token exists. Signing the JWT is twenty lines.
 */

export type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
  token_uri?: string;
};

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

const base64Url = (input: Buffer | string): string =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * Parses the service account from the environment.
 *
 * Accepts raw JSON or base64-encoded JSON, because a multi-line private key
 * in a `.env` file is awkward and base64 is the usual workaround.
 */
export function parseServiceAccount(
  raw: string | undefined | null
): ServiceAccount | null {
  if (!raw || !raw.trim()) return null;

  const candidates = [raw.trim()];

  if (!raw.trim().startsWith("{")) {
    try {
      candidates.push(
        Buffer.from(raw.trim(), "base64").toString("utf-8")
      );
    } catch {
      /* not base64 — the raw value is the only candidate */
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as ServiceAccount;
      if (parsed?.client_email && parsed?.private_key) return parsed;
    } catch {
      /* try the next candidate */
    }
  }

  return null;
}

export function serviceAccountFromEnv(): ServiceAccount | null {
  return parseServiceAccount(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

function signJwt(
  account: ServiceAccount,
  scope: string,
  nowSeconds: number
): string {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope,
      aud: account.token_uri ?? TOKEN_ENDPOINT,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64Url(signer.sign(account.private_key));

  return `${header}.${claims}.${signature}`;
}

type CachedToken = { token: string; expiresAt: number };

let cached: CachedToken | null = null;

/**
 * Exchanges the signed JWT for an access token.
 *
 * The token is cached until shortly before it expires. A failure throws, and
 * the caller turns that into an honest "needs configuration" state — it never
 * invents a result.
 */
export async function getAccessToken(
  account: ServiceAccount,
  scope: string = SCOPE
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > nowSeconds + 60) return cached.token;

  const assertion = signJwt(account, scope, nowSeconds);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Google token exchange failed (${response.status}): ${detail.slice(0, 200)}`
    );
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!body.access_token) {
    throw new Error("Google token exchange returned no access token.");
  }

  cached = {
    token: body.access_token,
    expiresAt: nowSeconds + (body.expires_in ?? 3600),
  };

  return cached.token;
}

/** Test hook — clears the cached token. */
export function resetTokenCache() {
  cached = null;
}
