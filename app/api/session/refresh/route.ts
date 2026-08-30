import {
  accessResponse,
  assertSameOrigin,
  cookieHeader,
  exchangeRefreshToken,
  OAuthExchangeError,
  refreshCookie,
  sessionErrorResponse,
} from "../_shared";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const refreshToken = refreshCookie(request);
    if (!refreshToken) return sessionErrorResponse("Session absente.", 401);
    const tokens = await exchangeRefreshToken(refreshToken);
    const headers: Record<string, string> = {};
    if (tokens.refresh_token)
      headers["Set-Cookie"] = cookieHeader(
        tokens.refresh_token,
        60 * 60 * 24 * 30,
      );
    return accessResponse(tokens, headers);
  } catch (error) {
    if (error instanceof Response) {
      const headers = new Headers(error.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("Pragma", "no-cache");
      return new Response(error.body, {
        status: error.status,
        statusText: error.statusText,
        headers,
      });
    }
    if (error instanceof OAuthExchangeError) {
      const terminal = error.status === 400 || error.status === 401;
      const headers: Record<string, string> = {};
      if (terminal) headers["Set-Cookie"] = cookieHeader("", 0);
      if (error.retryAfter) headers["Retry-After"] = error.retryAfter;
      return sessionErrorResponse(
        terminal
          ? "Session expirée."
          : "Rafraîchissement temporairement impossible.",
        error.status,
        headers,
      );
    }
    return sessionErrorResponse("Rafraîchissement impossible.", 503);
  }
}
