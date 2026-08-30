const CLIENT_ID = "pinkward-web";
const REFRESH_COOKIE = "pinkward_refresh";
const MAX_TOKEN_LENGTH = 16 * 1024;
const MAX_ACCESS_TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

export type OAuthTokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export class OAuthExchangeError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfter: string | null,
  ) {
    super(`OAuth token exchange failed with status ${status}`);
    this.name = "OAuthExchangeError";
  }
}

const refreshExchanges = new Map<string, Promise<OAuthTokenSet>>();

function backendOrigin() {
  const configured = (
    process.env.PINKWARD_BACKEND_ORIGIN ??
    (process.env.NODE_ENV === "development" ? "http://localhost:8088" : "")
  ).trim();
  if (!configured) return "";
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Response("Backend non configuré.", { status: 503 });
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    !["http:", "https:"].includes(parsed.protocol) ||
    (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
  )
    throw new Response("Backend non configuré.", { status: 503 });
  return parsed.origin;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  )
    throw new Response("Origine refusée.", { status: 403 });
}

export async function exchangeToken(parameters: URLSearchParams) {
  const origin = backendOrigin();
  if (!origin) throw new Response("Backend non configuré.", { status: 503 });
  const response = await fetch(`${origin}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: parameters,
  });
  if (!response.ok)
    throw new OAuthExchangeError(
      response.status,
      response.headers.get("retry-after"),
    );
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OAuthExchangeError(502, null);
  }
  if (!isOAuthTokenSet(payload)) throw new OAuthExchangeError(502, null);
  return payload;
}

function isOAuthTokenSet(value: unknown): value is OAuthTokenSet {
  if (!value || typeof value !== "object") return false;
  const tokens = value as Partial<OAuthTokenSet>;
  return (
    typeof tokens.access_token === "string" &&
    tokens.access_token.length > 0 &&
    tokens.access_token.length <= MAX_TOKEN_LENGTH &&
    (tokens.refresh_token === undefined ||
      (typeof tokens.refresh_token === "string" &&
        tokens.refresh_token.length > 0 &&
        tokens.refresh_token.length <= MAX_TOKEN_LENGTH)) &&
    Number.isInteger(tokens.expires_in) &&
    tokens.expires_in! > 0 &&
    tokens.expires_in! <= MAX_ACCESS_TOKEN_LIFETIME_SECONDS
  );
}

async function refreshKey(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function exchangeRefreshToken(token: string) {
  const key = await refreshKey(token);
  const existing = refreshExchanges.get(key);
  if (existing) return existing;
  const operation = exchangeToken(
    tokenParameters({ grant_type: "refresh_token", refresh_token: token }),
  );
  refreshExchanges.set(key, operation);
  try {
    return await operation;
  } finally {
    if (refreshExchanges.get(key) === operation) refreshExchanges.delete(key);
  }
}

export async function revokeRefreshToken(token: string) {
  const origin = backendOrigin();
  if (!origin) throw new Response("Backend non configuré.", { status: 503 });
  const response = await fetch(`${origin}/oauth2/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      token,
      token_type_hint: "refresh_token",
    }),
  });
  if (!response.ok)
    throw new Response("Révocation OAuth2 refusée.", {
      status: response.status,
    });
}

export function tokenParameters(values: Record<string, string>) {
  return new URLSearchParams({ client_id: CLIENT_ID, ...values });
}

export function refreshCookie(request: Request) {
  const source = request.headers.get("cookie") ?? "";
  for (const part of source.split(";")) {
    const cookie = part.trim();
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator) !== REFRESH_COOKIE)
      continue;
    const value = cookie.slice(separator + 1);
    try {
      return value ? decodeURIComponent(value) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function cookieHeader(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${REFRESH_COOKIE}=${encodeURIComponent(value)}; Path=/api/session; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function accessResponse(
  tokens: { access_token: string; expires_in: number },
  headers?: HeadersInit,
) {
  return Response.json(
    { access_token: tokens.access_token, expires_in: tokens.expires_in },
    {
      headers: { "Cache-Control": "no-store", Pragma: "no-cache", ...headers },
    },
  );
}

export function sessionErrorResponse(
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store", Pragma: "no-cache", ...headers },
    },
  );
}
