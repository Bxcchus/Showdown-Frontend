import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/session/token/route";

const verifier = "a".repeat(64);

function request(overrides: Record<string, unknown> = {}, origin = true) {
  return new Request("http://localhost:3000/api/session/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: "http://localhost:3000" } : {}),
    },
    body: JSON.stringify({
      code: "authorization-code",
      verifier,
      redirectUri: "http://localhost:3000/oauth/callback",
      ...overrides,
    }),
  });
}

describe("route BFF d’échange OAuth2", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("accepte uniquement le callback OAuth2 exact", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({ redirectUri: "http://localhost:3000/settings" }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse une requête sans preuve d’origine navigateur", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({}, false));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valide le format RFC 7636 du verifier PKCE", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({ verifier: "too-short" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse une réponse OAuth2 amont mal formée", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://identity.test");
    vi.stubEnv("WEB_CLIENT_SECRET", "s".repeat(43));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ access_token: "access", expires_in: -1 }),
        ),
    );

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Connexion temporairement impossible.",
    });
  });

  it("échange un code valide sans exposer le refresh token au DOM", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://identity.test");
    vi.stubEnv("WEB_CLIENT_SECRET", "s".repeat(43));
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        access_token: "access",
        refresh_token: "refresh",
        expires_in: 300,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      access_token: "access",
      expires_in: 300,
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://identity.test/oauth2/token");
    expect(String(init.body)).toContain("code_verifier=");
    expect(new Headers(init.headers).get("authorization")).toBe(
      `Basic ${btoa(`pinkward-web:${"s".repeat(43)}`)}`,
    );
    expect(String(init.body)).not.toContain("client_id=");
  });

  it("refuse une connexion sans refresh token persistant", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://identity.test");
    vi.stubEnv("WEB_CLIENT_SECRET", "s".repeat(43));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ access_token: "access", expires_in: 300 }),
        ),
    );

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
