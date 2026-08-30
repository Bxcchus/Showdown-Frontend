import { beforeEach, describe, expect, it, vi } from "vitest";

const PLAYER_ID = "11111111-1111-4111-8111-111111111111";
const SCOPES =
  "openid profile:read profile:write party:manage queue:write match:read match:ready";

function accessToken(label: string) {
  return [
    btoa(JSON.stringify({ alg: "none" })),
    btoa(
      JSON.stringify({
        sub: PLAYER_ID,
        preferred_username: label,
        scope: SCOPES.split(" "),
      }),
    ),
    label,
  ].join(".");
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("refresh OAuth mutualisé", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("n’échange qu’une fois un callback OAuth monté plusieurs fois", async () => {
    const gate = deferred<Response>();
    const fetchMock = vi.fn(() => gate.promise);
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem(
      "pinkward.oauth.flow",
      JSON.stringify({
        state: "callback-state",
        verifier: "a".repeat(64),
        redirectUri: "https://gyms.lol/oauth/callback",
      }),
    );
    window.history.replaceState(
      {},
      "",
      "/oauth/callback?code=one-time-code&state=callback-state",
    );
    const auth = await import("../app/lib/auth");

    const first = auth.completeLogin();
    const second = auth.completeLogin();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    gate.resolve(
      Response.json({
        access_token: accessToken("callback-player"),
        expires_in: 3600,
      }),
    );

    const [firstSession, secondSession] = await Promise.all([first, second]);
    expect(firstSession?.accessToken).toBe(secondSession?.accessToken);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe("/");
    expect(sessionStorage.getItem("pinkward.oauth.flow")).toBeNull();
  });

  it("partage un refresh entre les requêtes HTTP et le WebSocket", async () => {
    const gate = deferred<Response>();
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/session/refresh") {
        refreshCalls += 1;
        if (refreshCalls === 1)
          return Response.json({
            access_token: accessToken("expired"),
            expires_in: 0,
          });
        return gate.promise;
      }
      if (url.startsWith("/backend/")) return Response.json({ ok: true });
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();

    const requests = Array.from({ length: 12 }, (_, index) =>
      auth.authenticatedFetch(`/api/test/${index}`),
    );
    const protocols = auth.realtimeWebSocketProtocols();
    await vi.waitFor(() => expect(refreshCalls).toBe(2));
    gate.resolve(
      Response.json({
        access_token: accessToken("fresh"),
        expires_in: 3600,
      }),
    );

    expect((await Promise.all(requests)).every((value) => value.ok)).toBe(true);
    expect(await protocols).toEqual([
      "showdown-v1",
      `bearer.${accessToken("fresh")}`,
    ]);
    expect(refreshCalls).toBe(2); // bootstrap + une seule rotation partagée
  });

  it("mutualise aussi les 401 concurrents et ne rejoue chaque API qu’une fois", async () => {
    const gate = deferred<Response>();
    let refreshCalls = 0;
    let oldTokenCalls = 0;
    let freshTokenCalls = 0;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/session/refresh") {
          refreshCalls += 1;
          if (refreshCalls === 1)
            return Response.json({
              access_token: accessToken("old"),
              expires_in: 3600,
            });
          return gate.promise;
        }
        if (url.startsWith("/backend/")) {
          const authorization = new Headers(init?.headers).get("authorization");
          if (authorization === `Bearer ${accessToken("old")}`) {
            oldTokenCalls += 1;
            return new Response(null, { status: 401 });
          }
          freshTokenCalls += 1;
          return Response.json({ ok: true });
        }
        return new Response(null, { status: 204 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();

    const requests = Array.from({ length: 10 }, (_, index) =>
      auth.authenticatedFetch(`/api/protected/${index}`),
    );
    await vi.waitFor(() => expect(refreshCalls).toBe(2));
    gate.resolve(
      Response.json({
        access_token: accessToken("new"),
        expires_in: 3600,
      }),
    );
    const responses = await Promise.all(requests);

    expect(responses.every((value) => value.status === 200)).toBe(true);
    expect(refreshCalls).toBe(2);
    expect(oldTokenCalls).toBe(10);
    expect(freshTokenCalls).toBe(10);
  });

  it("conserve la session après une panne temporaire et permet un nouvel essai", async () => {
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/session/refresh") {
        refreshCalls += 1;
        if (refreshCalls === 1)
          return Response.json({
            access_token: accessToken("temporary"),
            expires_in: 0,
          });
        if (refreshCalls === 2) return new Response(null, { status: 503 });
        return Response.json({
          access_token: accessToken("recovered"),
          expires_in: 3600,
        });
      }
      if (url.startsWith("/backend/")) return Response.json({ ok: true });
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();

    await expect(
      auth.authenticatedFetch("/api/protected"),
    ).rejects.toBeInstanceOf(auth.SessionRefreshError);
    expect(auth.readSession()?.username).toBe("temporary");
    expect((await auth.authenticatedFetch("/api/protected")).ok).toBe(true);
    expect(auth.readSession()?.username).toBe("recovered");
    expect(refreshCalls).toBe(3);
  });

  it("empêche un refresh tardif de recréer une session après déconnexion", async () => {
    const gate = deferred<Response>();
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/session/refresh") {
        refreshCalls += 1;
        if (refreshCalls === 1)
          return Response.json({
            access_token: accessToken("expired"),
            expires_in: 0,
          });
        return gate.promise;
      }
      return new Response(null, { status: url.includes("logout") ? 204 : 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();
    const request = auth.authenticatedFetch("/api/protected");
    await vi.waitFor(() => expect(refreshCalls).toBe(2));
    const logout = auth.signOut();
    gate.resolve(
      Response.json({
        access_token: accessToken("late"),
        expires_in: 3600,
      }),
    );

    await expect(request).rejects.toThrow("Connexion requise");
    await logout;
    expect(auth.readSession()).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalide la session lorsqu’une API refuse aussi le jeton renouvelé", async () => {
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/session/refresh") {
        refreshCalls += 1;
        return Response.json({
          access_token: accessToken(refreshCalls === 1 ? "old" : "new"),
          expires_in: 3600,
        });
      }
      if (url.startsWith("/backend/"))
        return new Response(null, { status: 401 });
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();

    const response = await auth.authenticatedFetch("/api/protected");

    expect(response.status).toBe(401);
    expect(refreshCalls).toBe(2);
    expect(auth.readSession()).toBeNull();
    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/session/logout",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("purge également le jeton mémoire lors d’un logout provenant d’un autre onglet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          access_token: accessToken("cross-tab"),
          expires_in: 3600,
        }),
      ),
    );
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();
    const invalidated = vi.fn();
    const unsubscribe = auth.subscribeToSessionInvalidation(invalidated);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "pinkward.oauth.logout",
        newValue: String(Date.now()),
      }),
    );

    expect(auth.readSession()).toBeNull();
    expect(invalidated).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("ignore la suppression du marqueur de logout par un login dans un autre onglet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          access_token: accessToken("cross-tab-login"),
          expires_in: 3600,
        }),
      ),
    );
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();
    const invalidated = vi.fn();
    const unsubscribe = auth.subscribeToSessionInvalidation(invalidated);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "pinkward.oauth.logout",
        oldValue: String(Date.now()),
        newValue: null,
      }),
    );

    expect(auth.readSession()?.username).toBe("cross-tab-login");
    expect(invalidated).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("reste déconnecté après rechargement lorsque le BFF est hors ligne", async () => {
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/session/refresh") {
        refreshCalls += 1;
        return Response.json({
          access_token: accessToken("offline-logout"),
          expires_in: 3600,
        });
      }
      if (url === "/api/session/logout") throw new TypeError("offline");
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const auth = await import("../app/lib/auth");
    await auth.completeLogin();
    await auth.signOut();

    vi.resetModules();
    const reloaded = await import("../app/lib/auth");
    expect(await reloaded.completeLogin()).toBeNull();
    expect(refreshCalls).toBe(1);
  });
});
