import type { Page, Route, WebSocketRoute } from "@playwright/test";

const playerId = "11111111-1111-4111-8111-111111111111";
const botId = "22222222-2222-4222-8222-222222222222";
const matchId = "33333333-3333-4333-8333-333333333333";

const profile = {
  playerId,
  displayName: "local-player",
  region: "EUW",
  primaryRole: "MID",
  secondaryRole: "JUNGLE",
  riotId: "Claude Code#JAVA",
  riotProfileIconId: 29,
  riotSummonerLevel: 87,
  online: true,
};

const statistics = {
  mmr: 1500,
  peakMmr: 1560,
  skillMean: 25,
  skillDeviation: 8.3,
  season: "S2026",
  region: "EUW",
  placementGamesRemaining: 2,
  progression: 35,
  rank: "PLACEMENT",
  games: 3,
  wins: 2,
  losses: 1,
  winRate: 66.7,
  gamesByRole: { MID: 3 },
  recentForm: ["VICTORY", "DEFEAT", "VICTORY"],
};

const duelStatistics = {
  mmr: 1627,
  peakMmr: 1751,
  rating: 1627,
  ratingDeviation: 120,
  volatility: 0.06,
  algorithm: "GLICKO_2",
  season: "S2026",
  region: "EUW",
  placementGamesRemaining: 0,
  provisional: false,
  games: 6,
  wins: 4,
  losses: 2,
  winRate: 66.7,
  progression: 127,
};

const historyEntry = {
  matchId,
  region: "EUW",
  mode: "ONE_V_ONE",
  outcome: "VICTORY",
  team: "BLUE",
  role: "MID",
  playedAt: "2026-08-28T04:30:00Z",
  previousMmr: 1538,
  mmrDelta: 89,
  newMmr: 1627,
};

function token() {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode({
    sub: playerId,
    preferred_username: "local-player",
    scope: [
      "openid",
      "profile:read",
      "profile:write",
      "party:manage",
      "queue:write",
      "match:read",
      "match:ready",
    ],
  })}.signature`;
}

function fulfill(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export type MockState = {
  phase: "idle" | "queue" | "ready" | "lobby";
  mode: "ONE_V_ONE" | "FIVE_V_FIVE";
  queueRequest: Record<string, unknown> | null;
  historyRequests: string[];
  leaderboardRequests: string[];
  riotLinkRequest: Record<string, unknown> | null;
  botResultRequests: number;
  watcherOutcome: "VICTORY" | "DEFEAT" | null;
  readyAccepted: boolean;
  party: {
    partyId: string;
    leaderId: string;
    region: string;
    viewerIsLeader: boolean;
    allReady: boolean;
    capacity: number;
    members: Array<{
      playerId: string;
      displayName: string;
      primaryRole: string;
      secondaryRole: string;
      ready: boolean;
      online: boolean;
      simulated: boolean;
    }>;
    invitations: Array<{
      invitationId: string;
      inviteeId: string;
      displayName: string;
      status: string;
      expiresAt: string;
    }>;
  } | null;
  webSockets: WebSocketRoute[];
  webSocketUrls: string[];
  webSocketProtocols: string[][];
};

export async function installAuthenticatedMock(
  page: Page,
  options: {
    phase?: MockState["phase"];
    autoLobbyOnAccept?: boolean;
    authenticated?: boolean;
  } = {},
) {
  const localeCookies = await page.context().cookies("http://127.0.0.1:3100");
  if (!localeCookies.some((cookie) => cookie.name === "pinkward.language")) {
    await page.context().addCookies([
      {
        name: "pinkward.language",
        value: "fr",
        url: "http://127.0.0.1:3100",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }
  const accessToken = token();
  const state: MockState = {
    phase: options.phase ?? "idle",
    mode: "ONE_V_ONE",
    queueRequest: null,
    historyRequests: [],
    leaderboardRequests: [],
    riotLinkRequest: null,
    botResultRequests: 0,
    watcherOutcome: null,
    readyAccepted: false,
    party: null,
    webSockets: [],
    webSocketUrls: [],
    webSocketProtocols: [],
  };

  await page.routeWebSocket(
    /ws:\/\/localhost:8088\/api\/v2\/realtime\/.+/,
    (ws) => {
      state.webSockets.push(ws);
      state.webSocketUrls.push(ws.url());
      state.webSocketProtocols.push(ws.protocols());
    },
  );

  await page.route("**/api/session/refresh", (route) =>
    options.authenticated === false
      ? fulfill(route, { error: "Session absente." }, 401)
      : fulfill(route, { access_token: accessToken, expires_in: 3600 }),
  );

  await page.route("http://127.0.0.1:43991/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/health") return fulfill(route, { status: "UP" });
    if (path === "/v1/duels/status")
      return fulfill(route, {
        matchId: state.phase === "lobby" ? matchId : null,
        state: state.phase === "lobby" ? "IN_GAME" : "IDLE",
        detail: null,
        outcome: state.watcherOutcome,
        objective: state.watcherOutcome ? "FIRST_BLOOD" : null,
      });
    if (path === "/v1/identity")
      return fulfill(route, {
        puuid: "verified-puuid-1234567890",
        gameName: "Claude Code",
        tagLine: "JAVA",
        riotId: "Claude Code#JAVA",
        profileIconId: 29,
        summonerLevel: 87,
      });
    if (path === "/v1/session")
      return fulfill(route, { token: "local-test-token" });
    if (path === "/v1/bot-duels/start") return fulfill(route, {}, 202);
    return fulfill(route, {});
  });

  await page.route("**/backend/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");
    if (path === "/actuator/health/readiness")
      return fulfill(route, { status: "UP" });
    if (path === "/api/v2/players/me") return fulfill(route, profile);
    if (path === "/api/v2/players/me/presence") return fulfill(route, profile);
    if (
      path === "/api/v2/players/me/riot-link-challenges" &&
      request.method() === "POST"
    )
      return fulfill(
        route,
        {
          challengeId: "44444444-4444-4444-8444-444444444444",
          expiresAt: "2026-08-29T12:01:30Z",
        },
        201,
      );
    const riotLinkCompletion = path.match(
      /^\/api\/v2\/players\/me\/riot-link-challenges\/([^/]+)\/complete$/,
    );
    if (riotLinkCompletion && request.method() === "POST") {
      state.riotLinkRequest = {
        challengeId: riotLinkCompletion[1],
        ...request.postDataJSON(),
      };
      return fulfill(route, profile);
    }
    if (path === "/api/v2/players/directory")
      return fulfill(route, [
        { playerId, displayName: "local-player" },
        { playerId: botId, displayName: "PINKWARD BOT" },
      ]);
    if (path === "/api/v2/parties" && request.method() === "POST") {
      state.party = {
        partyId: "55555555-5555-4555-8555-555555555555",
        leaderId: playerId,
        region: "EUW",
        viewerIsLeader: true,
        allReady: false,
        capacity: 5,
        members: [
          {
            playerId,
            displayName: "local-player",
            primaryRole: "MID",
            secondaryRole: "JUNGLE",
            ready: false,
            online: true,
            simulated: false,
          },
        ],
        invitations: [],
      };
      return fulfill(route, state.party, 201);
    }
    if (
      path === "/api/v2/parties/current/invitations" &&
      request.method() === "POST" &&
      state.party
    ) {
      const displayName = String(request.postDataJSON().displayName);
      state.party.invitations.push({
        invitationId: "66666666-6666-4666-8666-666666666666",
        inviteeId: botId,
        displayName,
        status: "PENDING",
        expiresAt: "2099-08-28T04:31:00Z",
      });
      return fulfill(route, state.party);
    }
    if (
      path === "/api/v2/parties/current/ready" &&
      request.method() === "PUT" &&
      state.party
    ) {
      state.party.members[0].ready = Boolean(request.postDataJSON().ready);
      state.party.allReady = false;
      return fulfill(route, state.party);
    }
    if (path === "/api/v2/parties/current" && request.method() === "DELETE") {
      state.party = null;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/v2/parties/current") return fulfill(route, state.party);
    if (path === "/api/v2/parties/invitations") return fulfill(route, []);
    if (path === "/api/v2/matches/statistics")
      return fulfill(route, statistics);
    if (path === "/api/v2/matches/duel/statistics")
      return fulfill(route, duelStatistics);
    if (path === "/api/v2/matches/seasons")
      return fulfill(route, [
        {
          code: "S2026",
          startsAt: "2026-01-01T00:00:00Z",
          endsAt: "2027-01-01T00:00:00Z",
          placementGames: 5,
          resetFactor: 0.5,
          active: true,
        },
      ]);
    if (path.endsWith("/leaderboard")) {
      state.leaderboardRequests.push(url.search);
      const duel = path.includes("/duel/");
      const viewer = {
        position: 1,
        playerId,
        mmr: duel ? duelStatistics.mmr : statistics.mmr,
        ...(duel
          ? {
              ratingDeviation: duelStatistics.ratingDeviation,
              provisional: false,
            }
          : { rank: statistics.rank }),
        games: duel ? duelStatistics.games : statistics.games,
        wins: duel ? duelStatistics.wins : statistics.wins,
        winRate: duel ? duelStatistics.winRate : statistics.winRate,
        progression: duel ? duelStatistics.progression : statistics.progression,
      };
      return fulfill(route, {
        season: "S2026",
        region: url.searchParams.get("region") ?? "EUW",
        startsAt: "2026-01-01T00:00:00Z",
        endsAt: "2027-01-01T00:00:00Z",
        placementGames: 5,
        totalEntries: 1,
        viewer,
        entries: [viewer],
      });
    }
    if (path === "/api/v2/matches/history") {
      state.historyRequests.push(url.search);
      return fulfill(route, {
        content: [historyEntry],
        page: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }
    if (path === `/api/v2/matches/history/${matchId}`)
      return fulfill(route, {
        summary: historyEntry,
        teammates: [
          { playerId, team: "BLUE", role: "MID", bot: false, self: true },
        ],
        opponents: [
          { playerId: botId, team: "RED", role: "MID", bot: true, self: false },
        ],
      });

    const queue = {
      queueEntryId: "44444444-4444-4444-8444-444444444444",
      playerId,
      partyId: null,
      region: "EUW",
      mode: state.mode,
      primaryRole: "MID",
      secondaryRole: "JUNGLE",
      mmr: 1500,
      status: "QUEUED",
      joinedAt: "2026-08-28T04:29:00Z",
      reservationId: null,
    };
    const readyMatch = {
      matchId,
      region: "EUW",
      mode: state.mode,
      status: "READY_CHECK",
      createdAt: "2026-08-28T04:30:00Z",
      readyDeadline: "2099-08-28T04:31:00Z",
      lobbyName: null,
      lobbyPassword: null,
      winningTeam: null,
      players: [
        {
          playerId,
          team: "BLUE",
          readyState: state.readyAccepted ? "ACCEPTED" : "PENDING",
          bot: false,
          assignedRole: "MID",
        },
        {
          playerId: botId,
          team: "RED",
          readyState: "ACCEPTED",
          bot: true,
          assignedRole: "MID",
        },
      ],
    };
    const lobby = {
      ...readyMatch,
      status: "CONFIRMED",
      lobbyName: "SWD-E2E",
      lobbyPassword: "TEST1234",
      players: readyMatch.players.map((candidate) => ({
        ...candidate,
        readyState: "ACCEPTED",
      })),
    };
    if (path === "/api/v2/matchmaking/queue" && request.method() === "POST") {
      state.queueRequest = request.postDataJSON();
      state.mode =
        (state.queueRequest?.mode as MockState["mode"]) ?? "ONE_V_ONE";
      state.phase = "queue";
      return fulfill(route, { ...queue, mode: state.mode }, 201);
    }
    if (path === "/api/v2/matchmaking/queue")
      return fulfill(
        route,
        state.phase === "queue" ? { ...queue, mode: state.mode } : null,
      );
    if (path === "/api/v2/matches/current")
      return fulfill(
        route,
        state.phase === "ready" ? { ...readyMatch, mode: state.mode } : null,
      );
    if (path === "/api/v2/matches/current-lobby")
      return fulfill(
        route,
        state.phase === "lobby" ? { ...lobby, mode: state.mode } : null,
      );
    if (
      path === `/api/v2/matches/${matchId}/ready` &&
      request.method() === "POST"
    ) {
      if (options.autoLobbyOnAccept !== false) {
        state.phase = "lobby";
        return fulfill(route, { ...lobby, mode: state.mode });
      }
      state.readyAccepted = true;
      return fulfill(route, {
        ...readyMatch,
        mode: state.mode,
        players: readyMatch.players.map((candidate) =>
          candidate.playerId === playerId
            ? { ...candidate, readyState: "ACCEPTED" }
            : candidate,
        ),
      });
    }
    if (path === `/api/v2/matches/${matchId}/bot-result`) {
      state.botResultRequests += 1;
      return fulfill(route, { error: "Service scope required" }, 403);
    }
    return fulfill(route, { error: `Unhandled mock route: ${path}` }, 404);
  });
  return state;
}

export { matchId };
