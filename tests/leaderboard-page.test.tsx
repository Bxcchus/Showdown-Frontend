import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeaderboardPage from "../app/features/leaderboard-page";
import { BackendContext } from "../app/lib/backend-context";
import type {
  BackendState,
  LadderEntry,
  LeaderboardSnapshot,
} from "../app/lib/backend-types";
import { LanguageProvider } from "../app/lib/i18n";

const playerId = "11111111-1111-4111-8111-111111111111";
const opponentId = "22222222-2222-4222-8222-222222222222";

function entry(overrides: Partial<LadderEntry> = {}): LadderEntry {
  return {
    position: 1,
    playerId: opponentId,
    mmr: 1700,
    games: 10,
    wins: 6,
    winRate: 60,
    progression: 50,
    ...overrides,
  };
}

function snapshot(
  overrides: Partial<LeaderboardSnapshot> = {},
): LeaderboardSnapshot {
  return {
    season: "S2026",
    region: "EUW",
    startsAt: "2026-01-01T00:00:00Z",
    endsAt: "2026-12-31T23:59:59Z",
    placementGames: 5,
    totalEntries: 120,
    viewer: entry({
      position: 87,
      playerId,
      mmr: 1627,
      games: 20,
      wins: 10,
      winRate: 50,
      provisional: true,
    }),
    entries: [entry()],
    ...overrides,
  };
}

function backend(overrides: Partial<BackendState> = {}) {
  const duel = snapshot();
  const five = snapshot({
    totalEntries: 25,
    viewer: entry({
      position: 12,
      playerId,
      mmr: 1300,
      rank: "OR",
      games: 5,
      wins: 3,
      winRate: 60,
    }),
    entries: [entry({ mmr: 1400, rank: "PLATINE" })],
  });
  return {
    session: { playerId, username: "local-player" },
    sessionStatus: "AUTHENTICATED",
    profile: null,
    party: null,
    invitations: [],
    queue: null,
    match: null,
    lobby: null,
    history: [],
    recentHistory: [],
    historyPage: null,
    historyStatus: "READY",
    historyError: null,
    statistics: null,
    duelStatistics: null,
    fiveLeaderboard: five.entries,
    duelLeaderboard: duel.entries,
    fiveLeaderboardSnapshot: five,
    duelLeaderboardSnapshot: duel,
    leaderboardRegion: "EUW",
    leaderboardSeason: five,
    leaderboardStatus: "READY",
    leaderboardError: null,
    ratingSeasons: [],
    playerNames: { [opponentId]: "Rival" },
    watcherOnline: false,
    watcherJob: null,
    backendOnline: true,
    realtimeStatus: "CONNECTED",
    busy: false,
    error: null,
    notice: null,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    dismissError: vi.fn(),
    dismissNotice: vi.fn(),
    retry: vi.fn(),
    retryRealtime: vi.fn(),
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
    loadHistory: vi.fn(),
    loadMatchDetail: vi.fn(),
    loadLeaderboards: vi.fn(),
    ...overrides,
  } as unknown as BackendState;
}

function renderLeaderboard(state: BackendState) {
  return render(
    <LanguageProvider initialLanguage="fr">
      <BackendContext.Provider value={state}>
        <LeaderboardPage />
      </BackendContext.Provider>
    </LanguageProvider>,
  );
}

describe("données du classement", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/leaderboard?mode=1v1");
  });

  it("affiche la position personnelle hors du top chargé et le vrai total", () => {
    renderLeaderboard(backend());

    expect(screen.getByText("#87")).toBeInTheDocument();
    expect(screen.getByText("10 — 10")).toBeInTheDocument();
    expect(screen.getByText("20 MATCHS")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(
      screen.getByText("120 JOUEURS CLASSÉS · 5 PLACEMENTS"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Classement actuel")).toHaveAttribute(
      "src",
      expect.stringContaining("unranked.png"),
    );
  });

  it("sépare les données 1v1 et 5v5 et inscrit le mode dans l’historique URL", () => {
    renderLeaderboard(backend());

    expect(screen.getByText("MMR ACTUEL")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "5V5 TRUESKILL" }));
    expect(window.location.search).toBe("?mode=5v5");
    expect(screen.getByText("MMR ACTUEL")).toBeInTheDocument();
    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByText("3 — 2")).toBeInTheDocument();
    expect(
      screen.getByText("25 JOUEURS CLASSÉS · 5 PLACEMENTS"),
    ).toBeInTheDocument();
  });

  it("charge explicitement la région choisie", () => {
    const loadLeaderboards = vi.fn();
    renderLeaderboard(backend({ loadLeaderboards }));

    fireEvent.change(screen.getByLabelText("RÉGION"), {
      target: { value: "NA" },
    });
    expect(loadLeaderboards).toHaveBeenCalledWith("NA");
  });

  it("utilise des onglets complets et un tableau HTML nommé", () => {
    renderLeaderboard(backend());

    const activeTab = screen.getByRole("tab", { name: "1V1 GLICKO-2" });
    expect(activeTab).toHaveAttribute("aria-controls", "leaderboard-panel");
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      activeTab.id,
    );
    const table = screen.getByRole("table", { name: "Classement régional" });
    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
});
