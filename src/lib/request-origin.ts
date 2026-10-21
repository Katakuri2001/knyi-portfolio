/**
 * Reading the real address of a request.
 *
 * ## Why this module exists
 *
 * On Cloudflare Workers the request is forwarded to the Next.js server
 * function over an **internal** origin. A request that arrived at
 * `https://knyimediabuyer.xyz/admin` is presented to the application as
 * `http://localhost:8787/admin`, and `request.nextUrl.origin` reports that
 * internal address.
 *
 * That is wrong for three things the application does:
 *
 * - the **origin check** on writes — the browser's `Origin` header names the
 *   public host, so comparing it against the internal one rejects every
 *   legitimate write;
 * - the **Secure flag** on cookies — the internal origin is plain HTTP, so the
 *   cookie would be downgraded on a site that is served over HTTPS;
 * - the **SEO audit's** target — it would try to fetch `localhost` from inside
 *   the Worker, where nothing is listening.
 *
 * The public address is not lost. It arrives in `x-forwarded-host` and
 * `x-forwarded-proto`, which the platform sets from the real request. On a
 * Node host those headers are absent and `host` and `nextUrl` are correct, so
 * the same functions work in both places.
 *
 * These helpers read the headers first and fall back to the request URL. They
 * are deliberately the single place that knows about this difference.
 */

type RequestLike = {
  headers: Headers;
  nextUrl: URL;
};

/**
 * The host the visitor addressed, with the port when it is not the default.
 *
 * `x-forwarded-host` is a comma-separated list when a request has passed
 * through more than one proxy; the first entry is the original.
 */
export function requestHost(request: RequestLike): string {
  const forwarded = request.headers.get("x-forwarded-host");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;

  const host = request.headers.get("host");
  if (host) return host;

  return request.nextUrl.host;
}

/** The public origin the visitor addressed, e.g. `https://knyimediabuyer.xyz`. */
export function requestOrigin(request: RequestLike): string {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "");
  return `${protocol}://${requestHost(request)}`;
}

/**
 * Whether the request arrived over HTTPS.
 *
 * Derived from the request, **not** from `NODE_ENV`. A production build
 * served over plain HTTP — which is what `npm start` on a laptop is — would
 * otherwise set a `Secure` cookie that the browser refuses to store, making
 * the console impossible to sign in to.
 */
export function isSecureRequest(request: RequestLike): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  return request.nextUrl.protocol === "https:";
}
