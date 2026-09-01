import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HistoryPage from "../app/features/history-page";
import { BackendContext } from "../app/lib/backend-context";
import type {
  BackendState,
  HistoryEntry,
  HistoryPage as HistoryPagePayload,
  MatchDetail,
} from "../app/lib/backend-types";
import { LanguageProvider } from "../app/lib/i18n";

const playerId = "11111111-1111-4111-8111-111111111111";

function historyEntry(matchId: string): HistoryEntry {
  return {
    matchId,
    region: "EUW",
    mode: "ONE_V_ONE",
    outcome: "VICTORY",
    team: "BLUE",
    role: "MID",
    championName: "Draven",
    playedAt: "2026-08-28T12:00:00Z",
    previousMmr: 1500,
    mmrDelta: 42,
    newMmr: 1542,
  };
}

function page(
  pageNumber = 0,
  content = [historyEntry("match-a")],
): HistoryPagePayload {
  return {
    content,
    page: pageNumber,
    size: 25,
    totalElements: 30,
    totalPages: 2,
    hasPrevious: pageNumber > 0,
    hasNext: pageNumber === 0,
  };
}

function backend(overrides: Partial<BackendState> = {}): BackendState {
  const historyPage = page(1);
  return {
    session: { playerId, username: "local-player" },
    sessionStatus: "AUTHENTICATED",
    profile: null,
    party: null,
    invitations: [],
    queue: null,
    match: null,
    lobby: null,
    history: historyPage.content,
    recentHistory: [],
    historyPage,
    historyStatus: "READY",
    historyError: null,
    statistics: null,
    duelStatistics: null,
    fiveLeaderboard: [],
    duelLeaderboard: [],
    fiveLeaderboardSnapshot: null,
    duelLeaderboardSnapshot: null,
    leaderboardRegion: "EUW",
    leaderboardSeason: null,
    leaderboardStatus: "READY",
    leaderboardError: null,
    ratingSeasons: [],
    playerNames: {},
    watcherOnline: false,
    watcherJob: null,
    backendOnline: true,
    realtimeStatus: "CONNECTED",
    busy: false,
    error: null,
    notice: null,
    dismissError: vi.fn(),
    dismissNotice: vi.fn(),
    retry: vi.fn(),
    retryRealtime: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    joinQueue: vi.fn(),
    leaveQueue: vi.fn(),
    answerReady: vi.fn(),
    updateProfile: vi.fn(),
    linkRiotId: vi.fn(),
    createParty: vi.fn(),
    invitePlayer: vi.fn(),
    setPartyReady: vi.fn(),
    removePartyMember: vi.fn(),
    leaveParty: vi.fn(),
    respondPartyInvitation: vi.fn(),
    refreshWatcher: vi.fn(),
    loadHistory: vi
      .fn()
      .mockImplementation((requestedPage = 0) =>
        Promise.resolve(page(requestedPage)),
      ),
    loadMatchDetail: vi.fn().mockResolvedValue(null),
    loadLeaderboards: vi.fn(),
    ...overrides,
  };
}

function view(state: BackendState) {
  return render(
    <LanguageProvider initialLanguage="fr">
      <BackendContext.Provider value={state}>
        <HistoryPage />
      </BackendContext.Provider>
    </LanguageProvider>,
  );
}

describe("historique fiable", () => {
  beforeEach(() => window.history.replaceState({}, "", "/history"));

  it("restaure la page depuis l’URL et inscrit la pagination dans l’historique navigateur", async () => {
    window.history.replaceState({}, "", "/history?mode=1v1&page=2");
    const loadHistory = vi
      .fn()
      .mockImplementation((requestedPage = 0) =>
        Promise.resolve(page(requestedPage)),
      );
    view(backend({ loadHistory }));

    await waitFor(() =>
      expect(loadHistory).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ mode: "ONE_V_ONE" }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "PRÉCÉDENT" }));
    await waitFor(() =>
      expect(loadHistory).toHaveBeenLastCalledWith(0, expect.anything()),
    );
    expect(window.location.search).toBe("?mode=1v1");
  });

  it("affiche une erreur dédiée sans prétendre que l’historique est vide", () => {
    view(
      backend({
        history: [],
        historyPage: null,
        historyStatus: "ERROR",
        historyError: "Le serveur ne répond pas.",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Le serveur ne répond pas.",
    );
    expect(screen.queryByText("Aucun match trouvé")).not.toBeInTheDocument();
  });

  it("relie les onglets à leur panneau et groupe les filtres", () => {
    const { container } = view(backend());

    const activeTab = screen.getByRole("tab", { name: "TOUTES" });
    expect(activeTab).toHaveAttribute("aria-controls", "history-panel");
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      activeTab.id,
    );
    expect(
      screen.getByRole("group", { name: "Filtres de l’historique" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".history-entry-main > div")).toBeNull();
    expect(
      screen.getByRole("img", { name: "Champion joué : Draven" }),
    ).toHaveAttribute(
      "src",
      "https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/Draven.png",
    );
    expect(
      screen.getByRole("img", { name: "Carte : Abîme hurlant" }),
    ).toHaveAttribute("src", expect.stringContaining("aram-active.png"));
  });

  it("utilise les icônes de rôle dans le détail du match", async () => {
    const entry = historyEntry("match-role-icons");
    const loadMatchDetail = vi.fn().mockResolvedValue({
      summary: entry,
      teammates: [
        { playerId, team: "BLUE", role: "MID", bot: false, self: true },
      ],
      opponents: [
        {
          playerId: "bot-player",
          team: "RED",
          role: "BOT",
          bot: true,
          self: false,
        },
      ],
    });
    const { container } = view(
      backend({
        history: [entry],
        historyPage: page(0, [entry]),
        loadMatchDetail,
      }),
    );

    fireEvent.click(
      container.querySelector<HTMLButtonElement>(".history-entry-main")!,
    );

    expect(
      await screen.findByRole("img", { name: "Rôle : MID" }),
    ).toHaveAttribute("src", "/role-icons/mid.svg");
    expect(screen.getByRole("img", { name: "Rôle : ADC" })).toHaveAttribute(
      "src",
      "/role-icons/adc.svg",
    );
  });

  it("ignore le détail lent d’un ancien clic", async () => {
    let resolveFirst!: (value: MatchDetail) => void;
    let resolveSecond!: (value: MatchDetail) => void;
    const first = new Promise<MatchDetail>(
      (resolve) => (resolveFirst = resolve),
    );
    const second = new Promise<MatchDetail>(
      (resolve) => (resolveSecond = resolve),
    );
    const entries = [historyEntry("match-a"), historyEntry("match-b")];
    const loadMatchDetail = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const { container } = view(
      backend({
        history: entries,
        historyPage: page(0, entries),
        loadMatchDetail,
      }),
    );
    const buttons = container.querySelectorAll<HTMLButtonElement>(
      ".history-entry-main",
    );
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    resolveSecond({ summary: entries[1], teammates: [], opponents: [] });
    await screen.findByText("RÉSULTAT MMR");
    resolveFirst({ summary: entries[0], teammates: [], opponents: [] });
    await Promise.resolve();

    expect(window.location.search).toContain("match=match-b");
    expect(container.querySelectorAll(".history-entry.is-open")).toHaveLength(
      1,
    );
    expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
    expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
  });
});
