import {
  accessResponse,
  assertSameOrigin,
  cookieHeader,
  exchangeToken,
  OAuthExchangeError,
  publicRequestOrigin,
  sessionErrorResponse,
  tokenParameters,
} from "../_shared";

const MAX_EXCHANGE_BODY_BYTES = 16 * 1024;
const PKCE_VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;
const AUTHORIZATION_CODE = /^[^\u0000-\u001f\u007f]{1,4096}$/u;

async function exchangeBody(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new Response("Type de contenu refusé.", { status: 415 });
  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_EXCHANGE_BODY_BYTES
  )
    throw new Response("Payload trop volumineux.", { status: 413 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_EXCHANGE_BODY_BYTES)
    throw new Response("Payload trop volumineux.", { status: 413 });
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Response("Requête invalide.", { status: 400 });
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Response("Requête invalide.", { status: 400 });
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await exchangeBody(request);
    if (
      typeof body.code !== "string" ||
      !AUTHORIZATION_CODE.test(body.code) ||
      typeof body.verifier !== "string" ||
      !PKCE_VERIFIER.test(body.verifier) ||
      typeof body.redirectUri !== "string"
    )
      return sessionErrorResponse("Requête incomplète.", 400);
    const expectedRedirect = new URL(
      "/oauth/callback",
      publicRequestOrigin(request),
    ).href;
    let redirect: string;
    try {
      redirect = new URL(body.redirectUri).href;
    } catch {
      return sessionErrorResponse("Redirection refusée.", 400);
    }
    if (redirect !== expectedRedirect)
      return sessionErrorResponse("Redirection refusée.", 400);
    const tokens = await exchangeToken(
      tokenParameters({
        grant_type: "authorization_code",
        code: body.code,
        code_verifier: body.verifier,
        redirect_uri: body.redirectUri,
      }),
    );
    if (!tokens.refresh_token)
      throw new OAuthExchangeError(502, null);
    const headers: Record<string, string> = {};
    headers["Set-Cookie"] = cookieHeader(
      tokens.refresh_token,
      60 * 60 * 24 * 14,
    );
    return accessResponse(tokens, headers);
  } catch (error) {
    if (error instanceof Response)
      return sessionErrorResponse(
        error.status === 403
          ? "Origine refusée."
          : error.status === 413
            ? "Payload trop volumineux."
            : error.status === 415
              ? "Type de contenu refusé."
              : "Requête invalide.",
        error.status,
      );
    if (error instanceof OAuthExchangeError)
      return sessionErrorResponse(
        error.status === 400 || error.status === 401
          ? "Code OAuth2 refusé."
          : "Connexion temporairement impossible.",
        error.status,
        error.retryAfter ? { "Retry-After": error.retryAfter } : undefined,
      );
    return sessionErrorResponse("Connexion impossible.", 502);
  }
}
