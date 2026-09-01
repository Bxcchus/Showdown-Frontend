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
