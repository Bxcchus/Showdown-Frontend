import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH, POST, PUT } from "../app/backend/[...path]/route";

describe("proxy public", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("refuse par défaut une route non utilisée par le frontend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request("http://localhost:3000/backend/actuator/env"),
      { params: Promise.resolve({ path: ["actuator", "env"] }) },
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse une méthode non prévue sur une route publique", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await PATCH(
      new Request("http://localhost:3000/backend/api/v2/players/me", {
        method: "PATCH",
        body: "{}",
      }),
      {
        params: Promise.resolve({ path: ["api", "v2", "players", "me"] }),
      },
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ne transmet que les en-têtes applicatifs explicitement autorisés", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://gateway.test");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        { ok: true },
        {
          headers: {
            "X-Correlation-Id": "correlation-1",
            "Access-Control-Allow-Origin": "https://evil.test",
            "Set-Cookie": "gateway_secret=leak",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await PUT(
      new Request("http://localhost:3000/backend/api/v2/players/me", {
        method: "PUT",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
          "X-User-Id": "spoofed-user",
          "X-Forwarded-For": "203.0.113.10",
          Cookie: "pinkward_refresh=must-not-leak",
          Origin: "https://evil.test",
        },
        body: "{}",
      }),
      {
        params: Promise.resolve({ path: ["api", "v2", "players", "me"] }),
      },
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const forwarded = new Headers(init.headers);
    expect(forwarded.get("authorization")).toBe("Bearer test-token");
    expect(forwarded.get("content-type")).toBe("application/json");
    expect(forwarded.get("x-user-id")).toBeNull();
    expect(forwarded.get("x-forwarded-for")).toBeNull();
    expect(forwarded.get("cookie")).toBeNull();
    expect(forwarded.get("origin")).toBeNull();
    expect(response.headers.get("x-correlation-id")).toBe("correlation-1");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuse les segments non canoniques avant tout appel amont", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await DELETE(
      new Request("http://localhost:3000/backend/api/v2/parties/current"),
      {
        params: Promise.resolve({
          path: ["api", "v2", "parties", "..", "current"],
        }),
      },
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("borne la taille des payloads transmis au gateway", async () => {
    vi.stubEnv("PINKWARD_BACKEND_ORIGIN", "http://gateway.test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      new Request("http://localhost:3000/backend/api/v2/parties", {
        method: "POST",
        headers: { "Content-Length": String(64 * 1024 + 1) },
        body: "{}",
      }),
      {
        params: Promise.resolve({ path: ["api", "v2", "parties"] }),
      },
    );

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ne transmet jamais l’écriture manuelle d’un résultat", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      new Request(
        "http://localhost:3000/backend/api/v2/matches/match-1/result",
        { method: "POST", body: JSON.stringify({ outcome: "VICTORY" }) },
      ),
      {
        params: Promise.resolve({
          path: ["api", "v2", "matches", "match-1", "result"],
        }),
      },
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["bot-result", "POST"],
    ["bot-assignment", "GET"],
  ])("ne transmet jamais la route technique %s", async (suffix, method) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      new Request(
        `http://localhost:3000/backend/api/v2/matches/match-1/${suffix}`,
        { method },
      ),
      {
        params: Promise.resolve({
          path: ["api", "v2", "matches", "match-1", suffix],
        }),
      },
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ne transmet jamais une route interne de liaison Riot", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      new Request(
        "http://localhost:3000/backend/api/v2/internal/players/riot-link-challenges/challenge/complete",
        { method: "POST", body: "{}" },
      ),
      {
        params: Promise.resolve({
          path: [
            "api",
            "v2",
            "internal",
            "players",
            "riot-link-challenges",
            "challenge",
            "complete",
          ],
        }),
      },
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
