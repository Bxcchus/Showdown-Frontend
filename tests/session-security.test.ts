import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  assertSameOrigin,
  cookieHeader,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  refreshCookie,
} from "../app/api/session/_shared";
import { POST as logout } from "../app/api/session/logout/route";
import { POST as exchangeAuthorizationCode } from "../app/api/session/token/route";
import {
  PUBLIC_SCOPES,
  completeLogin,
  signOut,
  subscribeToSessionInvalidation,
} from "../app/lib/auth";
import { securityHeaders } from "../next.config";

describe("sécurité de session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("conserve le jeton de rafraîchissement dans un cookie HttpOnly strict", () => {
    const header = cookieHeader("secret", 3600);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Strict");
    expect(header).toContain("Path=/api/session");
  });

  it("limite le cookie de rafraîchissement à quatorze jours", () => {
    expect(cookieHeader("secret", REFRESH_COOKIE_MAX_AGE_SECONDS)).toContain(
      "Max-Age=1209600",
    );
  });

  it("autorise uniquement le proxy Docker HTTP pour une origine locale", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOWDOWN_WEB_ORIGIN", "http://localhost:8088");
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://caddy:8088");
    vi.stubEnv("WEB_CLIENT_SECRET", "s".repeat(43));
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ access_token: "access-token", expires_in: 3600 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await logout(
      new Request("http://web-app:3000/api/session/logout", {
        method: "POST",
        headers: {
          Origin: "http://localhost:8088",
          "Sec-Fetch-Site": "same-origin",
          Cookie: "pinkward_refresh=local-secret",
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://caddy:8088/oauth2/revoke");
  });

  it("refuse un backend HTTP distant en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOWDOWN_WEB_ORIGIN", "https://gyms.lol");
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://api.gyms.lol");
    vi.stubEnv("WEB_CLIENT_SECRET", "s".repeat(43));
    const response = await logout(
      new Request("http://web-app:3000/api/session/logout", {
        method: "POST",
        headers: {
          Origin: "https://gyms.lol",
          "Sec-Fetch-Site": "same-origin",
          Cookie: "pinkward_refresh=remote-secret",
        },
      }),
    );
    expect(response.status).toBe(503);
  });

  it("refuse une origine différente pour les mutations de session", () => {
    const request = new Request("http://localhost:3000/api/session/refresh", {
      method: "POST",
      headers: { Origin: "http://evil.test" },
    });
    expect(() => assertSameOrigin(request)).toThrow();
  });

  it("refuse aussi une mutation navigateur sans en-tête Origin", () => {
    const request = new Request("http://localhost:3000/api/session/refresh", {
      method: "POST",
    });
    expect(() => assertSameOrigin(request)).toThrow();
  });

  it("accepte l’origine publique configurée derrière le proxy Docker", () => {
    vi.stubEnv("SHOWDOWN_WEB_ORIGIN", "https://gyms.lol");
    const request = new Request("http://web-app:3000/api/session/refresh", {
      method: "POST",
      headers: {
        Origin: "https://gyms.lol",
        "Sec-Fetch-Site": "same-origin",
      },
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("refuse une autre origine même derrière le proxy Docker", () => {
    vi.stubEnv("SHOWDOWN_WEB_ORIGIN", "https://gyms.lol");
    const request = new Request("http://web-app:3000/api/session/refresh", {
      method: "POST",
      headers: {
        Origin: "https://attacker.example",
        "Sec-Fetch-Site": "cross-site",
      },
    });
    expect(() => assertSameOrigin(request)).toThrow();
  });

  it("échange le code OAuth avec le callback HTTPS public derrière Docker", async () => {
    vi.stubEnv("SHOWDOWN_WEB_ORIGIN", "https://gyms.lol");
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "https://api.gyms.lol");
    vi.stubEnv("WEB_CLIENT_SECRET", "s".repeat(43));
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await exchangeAuthorizationCode(
      new Request("http://web-app:3000/api/session/token", {
        method: "POST",
        headers: {
          Origin: "https://gyms.lol",
          "Sec-Fetch-Site": "same-origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "authorization-code",
          verifier: "v".repeat(43),
          redirectUri: "https://gyms.lol/oauth/callback",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain(
      "redirect_uri=https%3A%2F%2Fgyms.lol%2Foauth%2Fcallback",
    );
  });

  it("lit le cookie sans exposer les autres valeurs", () => {
    const request = new Request("http://localhost:3000/api/session/refresh", {
      headers: { Cookie: "foo=bar; pinkward_refresh=abc123" },
    });
    expect(refreshCookie(request)).toBe("abc123");
  });

  it("préserve les caractères égaux encodés dans le cookie OAuth2", () => {
    const request = new Request("http://localhost:3000/api/session/refresh", {
      headers: { Cookie: "pinkward_refresh=abc%3D%3D" },
    });
    expect(refreshCookie(request)).toBe("abc==");
  });

  it("révoque le refresh token distant et détruit toujours le cookie", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://identity.test");
    vi.stubEnv("WEB_CLIENT_SECRET", "s".repeat(43));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await logout(
      new Request("http://localhost:3000/api/session/logout", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "pinkward_refresh=remote-secret",
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://identity.test/oauth2/revoke");
    expect(String(init.body)).toContain("token=remote-secret");
  });

  it("ne demande jamais la portée publique d’écriture des résultats", () => {
    expect(PUBLIC_SCOPES.split(" ")).not.toContain("match:result");
  });

  it("garde le jeton d’accès en mémoire et jamais dans sessionStorage", async () => {
    const accessToken = [
      btoa(JSON.stringify({ alg: "none" })),
      btoa(
        JSON.stringify({
          sub: "11111111-1111-4111-8111-111111111111",
          preferred_username: "local-player",
          scope: PUBLIC_SCOPES.split(" "),
        }),
      ),
      "signature",
    ].join(".");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ access_token: accessToken, expires_in: 3600 }),
        ),
    );
    window.history.replaceState({}, "", "/");
    const session = await completeLogin();
    expect(session?.accessToken).toBe(accessToken);
    expect(sessionStorage.getItem("pinkward.oauth.access")).toBeNull();
    await signOut();
  });

  it("propage la déconnexion aux autres onglets", async () => {
    sessionStorage.setItem("pinkward.oauth.access", "secret");
    const callback = vi.fn();
    const unsubscribe = subscribeToSessionInvalidation(callback);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "pinkward.oauth.logout",
        newValue: String(Date.now()),
      }),
    );
    expect(callback).toHaveBeenCalledOnce();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await signOut();
    expect(sessionStorage.getItem("pinkward.oauth.access")).toBeNull();
    unsubscribe();
  });

  it("publie les en-têtes de défense du navigateur", () => {
    const headers = Object.fromEntries(
      securityHeaders.map(({ key, value }) => [key, value]),
    );
    expect(headers["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["Content-Security-Policy"]).toContain(
      "script-src-attr 'none'",
    );
    expect(headers["Content-Security-Policy"]).toContain("form-action 'self'");
    expect(headers["Content-Security-Policy"]).not.toContain(
      "connect-src 'self' http://localhost:8088",
    );
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("limite la CSP hébergée aux origines GYMS.LOL attendues", () => {
    const hostedHeaders = readFileSync("public/_headers", "utf8");
    expect(hostedHeaders).toContain(
      "connect-src 'self' https://api.gyms.lol wss://api.gyms.lol http://127.0.0.1:43991",
    );
    expect(hostedHeaders).toContain("form-action 'self'");
    expect(hostedHeaders).not.toContain("connect-src 'self' https: wss:");
    expect(hostedHeaders).not.toContain("form-action 'self' https:");
  });
});
