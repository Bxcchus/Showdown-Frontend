import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Home, Play } from "../app/experience";
import { Lobby } from "../app/features/match-flow-pages";
import ProfilePage from "../app/features/profile-page";
import { BackendContext } from "../app/lib/backend-context";
import type { BackendState } from "../app/lib/backend-types";
import { LanguageProvider } from "../app/lib/i18n";

const playerId = "11111111-1111-4111-8111-111111111111";

function backend(overrides: Partial<BackendState> = {}) {
  return {
    session: { playerId, username: "local-player" },
    sessionStatus: "AUTHENTICATED",
    profile: {
      playerId,
      displayName: "local-player",
      region: "EUW",
      primaryRole: "JUNGLE",
      secondaryRole: "MID",
      onboardingComplete: true,
      riotId: "Claude Code#JAVA",
      riotProfileIconId: 1,
      riotSummonerLevel: 100,
      online: true,
    },
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
    watcherOnline: true,
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
    joinQueue: vi.fn().mockResolvedValue(true),
    leaveQueue: vi.fn(),
    answerReady: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue(true),
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

function renderPage(content: React.ReactNode, state: BackendState) {
  return render(
    <LanguageProvider initialLanguage="fr">
      <BackendContext.Provider value={state}>{content}</BackendContext.Provider>
    </LanguageProvider>,
  );
}

const placementStatistics = {
  mmr: 1301,
  peakMmr: 1301,
  skillMean: 25,
  skillDeviation: 7,
  season: "S2026",
  region: "EUW",
  placementGamesRemaining: 4,
  progression: 101,
  rank: "PLACEMENT",
  games: 1,
  wins: 1,
  losses: 0,
  winRate: 100,
  gamesByRole: { BOT: 1 },
  recentForm: ["VICTORY"],
} as const;

describe("Partie rapide", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("lance réellement la file 5v5 affichée avec les rôles du profil", async () => {
    const joinQueue = vi.fn().mockResolvedValue(true);
    const go = vi.fn();
    renderPage(<Home go={go} />, backend({ joinQueue }));

    expect(screen.getByLabelText("Mode de partie rapide")).toHaveValue("5V5");
    fireEvent.click(screen.getByRole("button", { name: "JOUER MAINTENANT" }));

    await waitFor(() =>
      expect(joinQueue).toHaveBeenCalledWith("FIVE_V_FIVE", "JUNGLE", "MID"),
    );
    expect(go).toHaveBeenCalledWith("searching");
  });

  it("oriente le 1v1 vers l’installation quand le Watcher est absent", async () => {
    const joinQueue = vi.fn();
    const go = vi.fn();
    renderPage(<Home go={go} />, backend({ watcherOnline: false, joinQueue }));

    fireEvent.change(screen.getByLabelText("Mode de partie rapide"), {
      target: { value: "1V1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "JOUER MAINTENANT" }));

    await waitFor(() => expect(go).toHaveBeenCalledWith("download"));
    expect(joinQueue).not.toHaveBeenCalled();
  });

  it("affiche le champion réellement joué dans l’activité récente", () => {
    const { container } = renderPage(
      <Home go={vi.fn()} />,
      backend({
        recentHistory: [
          {
            matchId: "22222222-2222-4222-8222-222222222222",
            region: "EUW",
            mode: "ONE_V_ONE",
            outcome: "VICTORY",
            team: "BLUE",
            role: "MID",
            championName: "Draven",
            playedAt: "2026-08-31T12:00:00Z",
            previousMmr: 1500,
            mmrDelta: 20,
            newMmr: 1520,
          },
        ],
      }),
    );

    expect(container.querySelector(".home-activity-line img")).toHaveAttribute(
      "src",
      "https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/Draven.png",
    );
  });

  it("ne montre plus le bloc d’état en direct sur l’accueil", () => {
    renderPage(<Home go={vi.fn()} />, backend());

    expect(screen.queryByText("ÉTAT EN DIRECT")).not.toBeInTheDocument();
    expect(screen.queryByText("HORS FILE")).not.toBeInTheDocument();
  });

  it("affiche les placements restants au lieu de présenter la progression comme des LP", () => {
    renderPage(
      <Home go={vi.fn()} />,
      backend({ statistics: placementStatistics }),
    );

    expect(screen.getByText("4 MATCHS DE PLACEMENT RESTANTS")).toBeInTheDocument();
    expect(screen.queryByText("101 LP")).not.toBeInTheDocument();
  });

  it("sépare les classements actuels 5v5 et 1v1 sur l’accueil", () => {
    renderPage(<Home go={vi.fn()} />, backend());

    expect(screen.getByText("CLASSEMENT ACTUEL 5V5")).toBeInTheDocument();
    expect(screen.getByText("CLASSEMENT ACTUEL 1V1")).toBeInTheDocument();
    expect(screen.queryByText("VOIR LE CLASSEMENT")).not.toBeInTheDocument();
  });

  it("affiche les rôles du lobby avec leurs icônes", () => {
    renderPage(
      <Lobby />,
      backend({
        lobby: {
          matchId: "22222222-2222-4222-8222-222222222222",
          region: "EUW",
          mode: "FIVE_V_FIVE",
          status: "CONFIRMED",
          createdAt: "2026-09-01T12:00:00Z",
          readyDeadline: "2026-09-01T12:01:00Z",
          lobbyName: "SWD-TEST",
          lobbyPassword: "TEST1234",
          winningTeam: null,
          players: [
            {
              playerId,
              team: "BLUE",
              readyState: "ACCEPTED",
              bot: false,
              assignedRole: "MID",
            },
            {
              playerId: "bot-player",
              team: "RED",
              readyState: "ACCEPTED",
              bot: true,
              assignedRole: "BOT",
            },
          ],
        },
      }),
    );

    expect(screen.getByRole("img", { name: "Rôle : MID" })).toHaveAttribute(
      "src",
      "/role-icons/mid.svg",
    );
    expect(screen.getByRole("img", { name: "Rôle : ADC" })).toHaveAttribute(
      "src",
      "/role-icons/adc.svg",
    );
  });

  it("restaure le mode 5v5 demandé dans l’URL de la page Jouer", () => {
    window.history.replaceState({}, "", "/play?mode=5v5");
    renderPage(<Play go={vi.fn()} />, backend());

    expect(
      screen.getByRole("heading", { level: 1, name: "SUMMONER'S RIFT" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /5V5/ })).toHaveClass("selected");
  });

  it("conserve aussi l’état des placements sur la page Jouer", () => {
    window.history.replaceState({}, "", "/play?mode=5v5");
    renderPage(
      <Play go={vi.fn()} />,
      backend({ statistics: placementStatistics }),
    );

    expect(screen.getByText("4 MATCHS DE PLACEMENT RESTANTS")).toBeInTheDocument();
    expect(screen.queryByText("101 LP")).not.toBeInTheDocument();
  });

  it("distingue clairement le classé 5v5 du duel classé 1v1 sur le profil", () => {
    renderPage(
      <ProfilePage />,
      backend({
        statistics: placementStatistics,
        duelStatistics: {
          mmr: 1510,
          peakMmr: 1510,
          rating: 1500,
          ratingDeviation: 180,
          volatility: 0.06,
          algorithm: "GLICKO_2",
          season: "S2026",
          region: "EUW",
          placementGamesRemaining: 1,
          provisional: true,
          games: 4,
          wins: 3,
          losses: 1,
          winRate: 75,
          progression: 10,
        },
      }),
    );

    expect(screen.getByText("CLASSÉ 5V5")).toBeInTheDocument();
    expect(screen.getByText("DUEL CLASSÉ 1V1")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Mode classé 5v5 : Faille de l'invocateur",
      }),
    ).toHaveAttribute(
      "src",
      expect.stringContaining("summoners-rift-active.png"),
    );
    expect(
      screen.getByRole("img", { name: "Mode duel 1v1 : Abîme hurlant" }),
    ).toHaveAttribute("src", expect.stringContaining("aram-active.png"));

    const fiveRankCard = screen.getByRole("group", { name: "Classement 5v5" });
    const duelRankCard = screen.getByRole("group", { name: "Classement 1v1" });
    expect(within(fiveRankCard).getAllByText("1301")).toHaveLength(2);
    expect(within(fiveRankCard).getByText("100%")).toBeInTheDocument();
    expect(within(duelRankCard).getAllByText("1510")).toHaveLength(2);
    expect(within(duelRankCard).getByText("75%")).toBeInTheDocument();
    expect(within(duelRankCard).getByText("1 MATCH DE PLACEMENT RESTANT")).toBeInTheDocument();
  });

  it("expose les modes et rôles comme des choix exclusifs au clavier", () => {
    window.history.replaceState({}, "", "/play?mode=5v5");
    renderPage(<Play go={vi.fn()} />, backend());

    const modeGroup = screen.getByRole("radiogroup", { name: "Mode de jeu" });
    const fiveVersusFive = screen.getByRole("radio", { name: /5V5/ });
    expect(fiveVersusFive).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(fiveVersusFive, { key: "ArrowLeft" });
    expect(screen.getByRole("radio", { name: /1V1/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(modeGroup).toContainElement(
      screen.getByRole("radio", { name: /1V1/ }),
    );

    fireEvent.keyDown(screen.getByRole("radio", { name: /1V1/ }), {
      key: "ArrowRight",
    });
    const primaryRoles = screen.getByRole("radiogroup", {
      name: "RÔLE PRINCIPAL",
    });
    expect(
      within(primaryRoles).getByRole("radio", { name: "JUNGLE" }),
    ).toHaveAttribute("aria-checked", "true");
  });
});
