import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as refresh } from "../app/api/session/refresh/route";

function request(token = "shared-refresh") {
  return new Request("http://localhost:3000/api/session/refresh", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      Cookie: `pinkward_refresh=${token}`,
    },
  });
}

describe("route BFF de refresh", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("ne réalise qu’un échange pour deux requêtes simultanées avec le même cookie", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://identity.test");
    let release!: (response: Response) => void;
    const upstream = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const fetchMock = vi.fn(() => upstream);
    vi.stubGlobal("fetch", fetchMock);

    const first = refresh(request());
    const second = refresh(request());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    release(
      Response.json({
        access_token: "access",
        refresh_token: "rotated",
        expires_in: 300,
      }),
    );
    const responses = await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledOnce();
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toContain(
        "pinkward_refresh=rotated",
      );
      expect(await response.json()).toEqual({
        access_token: "access",
        expires_in: 300,
      });
    }
  });

  it("détruit le cookie uniquement lorsque le refresh est définitivement invalide", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://identity.test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 400 })),
    );
    const response = await refresh(request("invalid"));

    expect(response.status).toBe(400);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("préserve le cookie et Retry-After lors d’une saturation temporaire", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://identity.test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: 429, headers: { "Retry-After": "2" } }),
        ),
    );
    const response = await refresh(request("still-valid"));

    expect(response.status).toBe(429);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("retry-after")).toBe("2");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("désactive aussi le cache lorsque l’origine est refusée", async () => {
    const response = await refresh(
      new Request("http://localhost:3000/api/session/refresh", {
        method: "POST",
        headers: { Origin: "http://evil.test" },
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
