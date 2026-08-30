import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoryEntry, HistoryPage } from "../app/lib/backend-types";

const auth = vi.hoisted(() => ({
  session: {
    accessToken: "access",
    expiresAt: Date.now() + 60_000,
    playerId: "11111111-1111-4111-8111-111111111111",
    username: "local-player",
  },
  authenticatedFetch: vi.fn(),
  completeLogin: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../app/lib/auth", () => ({
  apiPath: (path: string) => `/backend${path}`,
  authenticatedFetch: auth.authenticatedFetch,
  beginLogin: vi.fn(),
  completeLogin: auth.completeLogin,
  readSession: vi.fn(() => auth.session),
  realtimeWebSocketProtocols: vi.fn().mockResolvedValue(null),
  signOut: auth.signOut,
  subscribeToSessionInvalidation: vi.fn(() => () => undefined),
  websocketOrigin: vi.fn(() => "ws://localhost:8088"),
}));

vi.mock("../app/lib/watcher-client", () => ({
  clearWatcherSession: vi.fn(),
  watcherFetch: vi.fn().mockRejectedValue(new Error("watcher offline")),
}));

import { BackendProvider, useBackend } from "../app/lib/backend";

function entry(matchId: string): HistoryEntry {
  return {
    matchId,
    region: "EUW",
    mode: "ONE_V_ONE",
    outcome: "VICTORY",
    team: "BLUE",
    role: "MID",
    playedAt: "2026-08-28T12:00:00Z",
    previousMmr: 1500,
    mmrDelta: 20,
    newMmr: 1520,
  };
}

function page(content: HistoryEntry[], pageNumber = 0): HistoryPage {
  return {
    content,
    page: pageNumber,
    size: 25,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    hasPrevious: false,
    hasNext: false,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

function Probe() {
  const backend = useBackend();
  return (
    <>
      <span data-testid="session-status">{backend.sessionStatus}</span>
      <span data-testid="history">{backend.history[0]?.matchId ?? "none"}</span>
      <span data-testid="recent">
        {backend.recentHistory[0]?.matchId ?? "none"}
      </span>
      <span data-testid="history-status">{backend.historyStatus}</span>
      <button
        type="button"
        onClick={() => void backend.loadHistory(0, { region: "EUW" })}
      >
        filtre EUW
      </button>
      <button
        type="button"
        onClick={() => void backend.loadHistory(0, { region: "NA" })}
      >
        filtre NA
      </button>
      <button type="button" onClick={() => void backend.refresh()}>
        compte
      </button>
      <button type="button" onClick={() => void backend.logout()}>
        logout
      </button>
    </>
  );
}

function mount() {
  return render(
    <BackendProvider>
      <Probe />
    </BackendProvider>,
  );
}

describe("ressource historique du BackendProvider", () => {
  beforeEach(() => {
    auth.authenticatedFetch.mockReset();
    auth.completeLogin.mockReset().mockResolvedValue(auth.session);
    auth.signOut.mockReset().mockResolvedValue(undefined);
  });

  it("garde la dernière requête filtrée et sépare le résumé récent", async () => {
    const euw = deferred<Response>();
    const na = deferred<Response>();
    auth.authenticatedFetch.mockImplementation(async (path: string) => {
      if (path.includes("/matches/history?") && path.includes("size=25")) {
        if (path.includes("region=EUW")) return euw.promise;
        if (path.includes("region=NA")) return na.promise;
      }
      if (path.includes("/matches/history?") && path.includes("size=5"))
        return Response.json(page([entry("recent-match")]));
      return new Response(null, { status: 404 });
    });
    mount();
    await screen.findByText("AUTHENTICATED");

    fireEvent.click(screen.getByRole("button", { name: "filtre EUW" }));
    fireEvent.click(screen.getByRole("button", { name: "filtre NA" }));
    na.resolve(Response.json(page([entry("na-match")])));
    await waitFor(() =>
      expect(screen.getByTestId("history")).toHaveTextContent("na-match"),
    );
    euw.resolve(Response.json(page([entry("euw-stale")])));
    await act(() => Promise.resolve());

    expect(screen.getByTestId("history")).toHaveTextContent("na-match");
    expect(screen.getByTestId("recent")).toHaveTextContent("recent-match");
    fireEvent.click(screen.getByRole("button", { name: "compte" }));
    await waitFor(() =>
      expect(screen.getByTestId("recent")).toHaveTextContent("recent-match"),
    );
    expect(screen.getByTestId("history")).toHaveTextContent("na-match");
  });

  it("quitte la préparation dès que la session est établie même si les données restent lentes", async () => {
    const pending = deferred<Response>();
    auth.authenticatedFetch.mockImplementation(() => pending.promise);

    mount();

    await waitFor(() =>
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "AUTHENTICATED",
      ),
    );
  });

  it("n’autorise pas une réponse en vol à repeupler l’historique après logout", async () => {
    const pending = deferred<Response>();
    auth.authenticatedFetch.mockImplementation(async (path: string) => {
      if (path.includes("/matches/history?") && path.includes("size=25"))
        return pending.promise;
      return new Response(null, { status: 404 });
    });
    mount();
    await screen.findByText("AUTHENTICATED");
    fireEvent.click(screen.getByRole("button", { name: "filtre EUW" }));
    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalledOnce());
    pending.resolve(Response.json(page([entry("private-late-match")])));
    await act(() => Promise.resolve());

    expect(screen.getByTestId("history")).toHaveTextContent("none");
    expect(screen.getByTestId("history-status")).toHaveTextContent("IDLE");
  });

  it("réessaie une seule fois après un 429 puis publie la page valide", async () => {
    let attempts = 0;
    auth.authenticatedFetch.mockImplementation(async (path: string) => {
      if (path.includes("/matches/history?") && path.includes("size=25")) {
        attempts += 1;
        if (attempts === 1)
          return new Response(null, {
            status: 429,
            headers: { "Retry-After": "0" },
          });
        return Response.json(page([entry("retried-match")]));
      }
      return new Response(null, { status: 404 });
    });
    mount();
    await screen.findByText("AUTHENTICATED");

    fireEvent.click(screen.getByRole("button", { name: "filtre EUW" }));

    await waitFor(() =>
      expect(screen.getByTestId("history")).toHaveTextContent("retried-match"),
    );
    expect(attempts).toBe(2);
    expect(screen.getByTestId("history-status")).toHaveTextContent("READY");
  });
});
