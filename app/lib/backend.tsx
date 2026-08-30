"use client";

import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackendContext } from "./backend-context";
import {
  apiPath,
  authenticatedFetch,
  beginLogin,
  completeLogin,
  readSession,
  realtimeWebSocketProtocols,
  signOut,
  subscribeToSessionInvalidation,
  websocketOrigin,
  type UserSession,
} from "./auth";
import type {
  ApiRole,
  ApiMode,
  PlayerProfile,
  PartySnapshot,
  PartyInvitation,
  QueueEntry,
  CurrentMatch,
  HistoryPage,
  HistoryEntry,
  HistoryRequest,
  HistoryLoadStatus,
  MatchStatistics,
  DuelStatistics,
  LadderEntry,
  LeaderboardSnapshot,
  LeaderboardLoadStatus,
  RatingSeasonInfo,
  WatcherJob,
  ProfileUpdate,
  BackendState,
  RealtimeStatus,
  SessionStatus,
} from "./backend-types";
export type {
  ApiRole,
  ApiMode,
  PlayerProfile,
  PartyMember,
  PartySnapshot,
  PartyInvitation,
  QueueEntry,
  MatchPlayer,
  CurrentMatch,
  HistoryEntry,
  HistoryPage,
  HistoryLoadStatus,
  HistoryRequest,
  MatchParticipant,
  MatchDetail,
  MatchStatistics,
  DuelStatistics,
  LadderEntry,
  LeaderboardSnapshot,
  LeaderboardLoadStatus,
  RatingSeasonInfo,
  WatcherJob,
  ProfileUpdate,
  BackendState,
  RealtimeStatus,
  SessionStatus,
} from "./backend-types";

import { clearWatcherSession, watcherFetch } from "./watcher-client";

import {
  errorMessage,
  fetchHistoryResponse,
  friendlyError,
  isBotDuel,
  isHistoryPage,
  isLeaderboardSnapshot,
  isMatchDetail,
  jsonOrNull,
} from "./backend-api";

export function BackendProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("LOADING");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [party, setParty] = useState<PartySnapshot | null>(null);
  const [invitations, setInvitations] = useState<PartyInvitation[]>([]);
  const [queue, setQueue] = useState<QueueEntry | null>(null);
  const [match, setMatch] = useState<CurrentMatch | null>(null);
  const [lobby, setLobby] = useState<CurrentMatch | null>(null);
  const [historyPage, setHistoryPage] = useState<HistoryPage | null>(null);
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);
  const [historyStatus, setHistoryStatus] = useState<HistoryLoadStatus>("IDLE");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<MatchStatistics | null>(null);
  const [duelStatistics, setDuelStatistics] = useState<DuelStatistics | null>(
    null,
  );
  const [fiveLeaderboard, setFiveLeaderboard] = useState<LadderEntry[]>([]);
  const [duelLeaderboard, setDuelLeaderboard] = useState<LadderEntry[]>([]);
  const [fiveLeaderboardSnapshot, setFiveLeaderboardSnapshot] =
    useState<LeaderboardSnapshot | null>(null);
  const [duelLeaderboardSnapshot, setDuelLeaderboardSnapshot] =
    useState<LeaderboardSnapshot | null>(null);
  const [leaderboardRegion, setLeaderboardRegion] = useState("EUW");
  const [leaderboardSeason, setLeaderboardSeason] =
    useState<LeaderboardSnapshot | null>(null);
  const [leaderboardStatus, setLeaderboardStatus] =
    useState<LeaderboardLoadStatus>("IDLE");
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [ratingSeasons, setRatingSeasons] = useState<RatingSeasonInfo[]>([]);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [watcherOnline, setWatcherOnline] = useState(false);
  const [watcherJob, setWatcherJob] = useState<WatcherJob | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("IDLE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const botWatcherStarted = useRef<string | null>(null);
  const historyRequestSequence = useRef(0);
  const historyAbort = useRef<AbortController | null>(null);
  const historyQuery = useRef<{ page: number; filters: HistoryRequest } | null>(
    null,
  );
  const detailRequestSequence = useRef(0);
  const detailAbort = useRef<AbortController | null>(null);
  const leaderboardRequestSequence = useRef(0);
  const leaderboardAbort = useRef<AbortController | null>(null);
  const logoutInFlight = useRef<Promise<void> | null>(null);
  const joinQueueInFlight = useRef<Promise<boolean> | null>(null);
  const queueCommand = useRef<{ fingerprint: string; key: string } | null>(
    null,
  );
  const realtimeRetryRef = useRef<() => void>(() => undefined);
  const retryRealtime = useCallback(() => realtimeRetryRef.current(), []);

  const clearAuthenticatedState = useCallback(() => {
    setSession(null);
    setSessionStatus("ANONYMOUS");
    setRealtimeStatus("IDLE");
    setProfile(null);
    setParty(null);
    setInvitations([]);
    setQueue(null);
    setMatch(null);
    setLobby(null);
    historyRequestSequence.current += 1;
    historyAbort.current?.abort();
    historyQuery.current = null;
    detailRequestSequence.current += 1;
    detailAbort.current?.abort();
    leaderboardRequestSequence.current += 1;
    leaderboardAbort.current?.abort();
    setHistoryPage(null);
    setRecentHistory([]);
    setHistoryStatus("IDLE");
    setHistoryError(null);
    setStatistics(null);
    setDuelStatistics(null);
    setFiveLeaderboard([]);
    setDuelLeaderboard([]);
    setFiveLeaderboardSnapshot(null);
    setDuelLeaderboardSnapshot(null);
    setLeaderboardRegion("EUW");
    setLeaderboardSeason(null);
    setLeaderboardStatus("IDLE");
    setLeaderboardError(null);
    setRatingSeasons([]);
    setPlayerNames({});
    setWatcherJob(null);
    botWatcherStarted.current = null;
    queueCommand.current = null;
    clearWatcherSession();
    setBusy(false);
    setError(null);
    setNotice(null);
  }, []);

  const resolveNames = useCallback(async (ids: string[]) => {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return;
    const response = await authenticatedFetch(
      `/api/v2/players/directory?ids=${encodeURIComponent(unique.join(","))}`,
    );
    if (!response.ok) return;
    const values = (await response.json()) as Array<{
      playerId: string;
      displayName: string;
    }>;
    setPlayerNames((current) => ({
      ...current,
      ...Object.fromEntries(
        values.map((value) => [value.playerId, value.displayName]),
      ),
    }));
  }, []);

  const loadLive = useCallback(async () => {
    if (!readSession()) return;
    const [nextQueue, nextMatch, nextLobby, nextParty, nextInvitations] =
      await Promise.all([
        jsonOrNull<QueueEntry>("/api/v2/matchmaking/queue"),
        jsonOrNull<CurrentMatch>("/api/v2/matches/current"),
        jsonOrNull<CurrentMatch>("/api/v2/matches/current-lobby"),
        jsonOrNull<PartySnapshot>("/api/v2/parties/current"),
        jsonOrNull<PartyInvitation[]>("/api/v2/parties/invitations"),
      ]);
    if (nextQueue !== undefined) setQueue(nextQueue);
    if (nextMatch !== undefined) setMatch(nextMatch);
    if (nextLobby !== undefined) setLobby(nextLobby);
    if (nextParty !== undefined) setParty(nextParty);
    if (nextInvitations !== undefined) setInvitations(nextInvitations ?? []);
    await resolveNames(
      [...(nextMatch?.players ?? []), ...(nextLobby?.players ?? [])]
        .filter((p) => !p.bot)
        .map((p) => p.playerId),
    );
  }, [resolveNames]);

  const loadHistory = useCallback(
    async (page = 0, filters: HistoryRequest = {}) => {
      const owner = readSession()?.playerId;
      if (!owner) return null;
      const normalizedPage = Math.max(0, Math.trunc(page));
      historyQuery.current = { page: normalizedPage, filters };
      const sequence = ++historyRequestSequence.current;
      historyAbort.current?.abort();
      const controller = new AbortController();
      historyAbort.current = controller;
      setHistoryStatus("LOADING");
      setHistoryError(null);
      try {
        let requestedPage = normalizedPage;
        for (let pass = 0; pass < 2; pass += 1) {
          const parameters = new URLSearchParams({
            page: String(requestedPage),
            size: "25",
          });
          if (filters.mode) parameters.set("mode", filters.mode);
          if (filters.region) parameters.set("region", filters.region);
          if (filters.role) parameters.set("role", filters.role);
          if (filters.outcome) parameters.set("outcome", filters.outcome);
          const response = await fetchHistoryResponse(
            `/api/v2/matches/history?${parameters}`,
            controller.signal,
          );
          if (!response.ok) {
            const message = await errorMessage(
              response,
              "Historique indisponible.",
            );
            throw new Error(
              response.status === 429 ? `API 429: ${message}` : message,
            );
          }
          const payload: unknown = await response.json();
          if (!isHistoryPage(payload))
            throw new Error("Le serveur a renvoyé un historique invalide.");
          if (
            payload.totalPages > 0 &&
            requestedPage >= payload.totalPages &&
            pass === 0
          ) {
            requestedPage = payload.totalPages - 1;
            continue;
          }
          if (
            sequence !== historyRequestSequence.current ||
            controller.signal.aborted ||
            readSession()?.playerId !== owner
          )
            return null;
          setHistoryPage(payload);
          setHistoryStatus("READY");
          historyQuery.current = { page: payload.page, filters };
          return payload;
        }
        return null;
      } catch (cause) {
        if (
          controller.signal.aborted ||
          sequence !== historyRequestSequence.current
        )
          return null;
        setHistoryStatus("ERROR");
        setHistoryError(friendlyError(cause, "Historique indisponible."));
        return null;
      } finally {
        if (historyAbort.current === controller) historyAbort.current = null;
      }
    },
    [],
  );

  const fetchLeaderboards = useCallback(
    async (region: string) => {
      const normalizedRegion = region.trim().toUpperCase();
      const sequence = ++leaderboardRequestSequence.current;
      leaderboardAbort.current?.abort();
      const controller = new AbortController();
      leaderboardAbort.current = controller;
      setLeaderboardRegion(normalizedRegion);
      setLeaderboardStatus("LOADING");
      setLeaderboardError(null);
      // Never relabel rows from a previous region while a new request loads.
      setFiveLeaderboard([]);
      setDuelLeaderboard([]);
      setFiveLeaderboardSnapshot(null);
      setDuelLeaderboardSnapshot(null);
      setLeaderboardSeason(null);
      try {
        const [fiveResponse, duelResponse, seasonsResponse] = await Promise.all(
          [
            authenticatedFetch(
              `/api/v2/matches/leaderboard?region=${encodeURIComponent(normalizedRegion)}&limit=50`,
              { signal: controller.signal },
            ),
            authenticatedFetch(
              `/api/v2/matches/duel/leaderboard?region=${encodeURIComponent(normalizedRegion)}&limit=50`,
              { signal: controller.signal },
            ),
            authenticatedFetch("/api/v2/matches/seasons", {
              signal: controller.signal,
            }),
          ],
        );
        for (const response of [fiveResponse, duelResponse, seasonsResponse]) {
          if (!response.ok) {
            const message = await errorMessage(
              response,
              "Classement indisponible.",
            );
            throw new Error(
              response.status === 429 ? `API 429: ${message}` : message,
            );
          }
        }
        const [fiveValue, duelValue, seasonsValue]: [
          unknown,
          unknown,
          unknown,
        ] = await Promise.all([
          fiveResponse.json(),
          duelResponse.json(),
          seasonsResponse.json(),
        ]);
        if (!isLeaderboardSnapshot(fiveValue))
          throw new Error("Le classement 5v5 reçu est invalide.");
        if (!isLeaderboardSnapshot(duelValue))
          throw new Error("Le classement 1v1 reçu est invalide.");
        if (!Array.isArray(seasonsValue))
          throw new Error("La liste des saisons reçue est invalide.");
        if (
          fiveValue.region !== normalizedRegion ||
          duelValue.region !== normalizedRegion
        )
          throw new Error("Le classement reçu ne correspond pas à la région.");
        if (
          controller.signal.aborted ||
          sequence !== leaderboardRequestSequence.current
        )
          return;
        const seasons = seasonsValue as RatingSeasonInfo[];
        setFiveLeaderboardSnapshot(fiveValue);
        setDuelLeaderboardSnapshot(duelValue);
        setFiveLeaderboard(fiveValue.entries);
        setDuelLeaderboard(duelValue.entries);
        setLeaderboardSeason(fiveValue);
        setRatingSeasons(seasons);
        setLeaderboardStatus("READY");
        void resolveNames(
          [
            ...fiveValue.entries,
            ...duelValue.entries,
            ...(fiveValue.viewer ? [fiveValue.viewer] : []),
            ...(duelValue.viewer ? [duelValue.viewer] : []),
          ].map((entry) => entry.playerId),
        ).catch(() => undefined);
      } catch (cause) {
        if (
          controller.signal.aborted ||
          sequence !== leaderboardRequestSequence.current
        )
          return;
        setLeaderboardStatus("ERROR");
        setLeaderboardError(friendlyError(cause, "Classement indisponible."));
      } finally {
        if (leaderboardAbort.current === controller)
          leaderboardAbort.current = null;
      }
    },
    [resolveNames],
  );

  const loadAccount = useCallback(async () => {
    const owner = readSession()?.playerId;
    if (!owner) return;
    const nextProfile = await jsonOrNull<PlayerProfile>("/api/v2/players/me");
    if (readSession()?.playerId !== owner) return;
    if (nextProfile !== undefined) setProfile(nextProfile);
    const region = nextProfile?.region ?? "EUW";
    const [recent, stats, duelStats] = await Promise.all([
      jsonOrNull<HistoryPage>("/api/v2/matches/history?page=0&size=5"),
      jsonOrNull<MatchStatistics>(
        `/api/v2/matches/statistics?region=${region}`,
      ),
      jsonOrNull<DuelStatistics>(
        `/api/v2/matches/duel/statistics?region=${region}`,
      ),
    ]);
    if (readSession()?.playerId !== owner) return;
    if (recent !== undefined && (recent === null || isHistoryPage(recent)))
      setRecentHistory(recent?.content ?? []);
    if (stats !== undefined) setStatistics(stats);
    if (duelStats !== undefined) setDuelStatistics(duelStats);
    await fetchLeaderboards(region);
  }, [fetchLeaderboards]);

  const refresh = useCallback(async () => {
    if (!readSession()) return;
    setError(null);
    try {
      await Promise.all([loadLive(), loadAccount()]);
      setBackendOnline(true);
    } catch (cause) {
      setBackendOnline(false);
      setError(friendlyError(cause, "Le backend ne répond pas."));
    }
  }, [loadAccount, loadLive]);

  const refreshWatcher = useCallback(async () => {
    try {
      const [health, status] = await Promise.all([
        watcherFetch("/health"),
        watcherFetch("/v1/duels/status", {}, true),
      ]);
      setWatcherOnline(health.ok);
      if (status.ok) setWatcherJob((await status.json()) as WatcherJob);
    } catch {
      setWatcherOnline(false);
      setWatcherJob(null);
    }
  }, []);

  useEffect(() => {
    const startup = window.setTimeout(() => {
      fetch(apiPath("/actuator/health/readiness"))
        .then((response) => setBackendOnline(response.ok))
        .catch(() => setBackendOnline(false));
      completeLogin()
        .then((connected) => {
          setSession(connected);
          if (connected) {
            setSessionStatus("AUTHENTICATED");
            // Authentication is complete at this point. Account and match data
            // load in the background so one slow microservice cannot leave the
            // entire application stuck on the preparation screen.
            void refresh();
          } else {
            setSessionStatus("ANONYMOUS");
            setRealtimeStatus("IDLE");
          }
        })
        .catch((cause) => {
          setSessionStatus("ANONYMOUS");
          setRealtimeStatus("IDLE");
          setError(
            cause instanceof Error ? cause.message : "Connexion impossible.",
          );
        });
      void refreshWatcher();
    }, 0);
    return () => window.clearTimeout(startup);
  }, [refresh, refreshWatcher]);

  useEffect(
    () => subscribeToSessionInvalidation(clearAuthenticatedState),
    [clearAuthenticatedState],
  );

  useEffect(
    () => () => {
      historyRequestSequence.current += 1;
      historyAbort.current?.abort();
      detailRequestSequence.current += 1;
      detailAbort.current?.abort();
      leaderboardRequestSequence.current += 1;
      leaderboardAbort.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!session) {
      realtimeRetryRef.current = () => undefined;
      return;
    }
    let disposed = false;
    let reconnectAttempt = 0;
    let generation = 0;
    let reconnectTimer: number | undefined;
    let handshakeTimer: number | undefined;
    let realtimeRefresh: number | undefined;
    let sockets: WebSocket[] = [];
    let connectedSockets = 0;
    let liveRefreshInFlight: Promise<void> | null = null;

    const refreshLive = () => {
      if (liveRefreshInFlight) return liveRefreshInFlight;
      liveRefreshInFlight = loadLive()
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false))
        .finally(() => {
          liveRefreshInFlight = null;
        });
      return liveRefreshInFlight;
    };

    const disposeSockets = () => {
      for (const socket of sockets) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        )
          socket.close();
      }
      sockets = [];
      connectedSockets = 0;
      window.clearTimeout(handshakeTimer);
    };

    const scheduleReconnect = (immediate = false) => {
      if (disposed || reconnectTimer !== undefined) return;
      generation += 1;
      disposeSockets();
      if (navigator.onLine === false) {
        setRealtimeStatus("OFFLINE");
        return;
      }
      setRealtimeStatus("RECONNECTING");
      const base = Math.min(30_000, 1_000 * 2 ** reconnectAttempt);
      const delay = immediate
        ? 0
        : Math.min(30_000, Math.round(base * (0.8 + Math.random() * 0.4)));
      reconnectAttempt += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (disposed) return;
      if (navigator.onLine === false) {
        setRealtimeStatus("OFFLINE");
        return;
      }
      const ownGeneration = ++generation;
      setRealtimeStatus(reconnectAttempt ? "RECONNECTING" : "CONNECTING");
      try {
        const protocols = await realtimeWebSocketProtocols();
        if (disposed || ownGeneration !== generation) return;
        if (!protocols) {
          setRealtimeStatus("OFFLINE");
          return;
        }
        sockets = ["/api/v2/realtime/party", "/api/v2/realtime/matches"].map(
          (route) => {
            const socket = new WebSocket(
              `${websocketOrigin()}${route}`,
              protocols,
            );
            socket.onopen = () => {
              if (disposed || ownGeneration !== generation) return;
              connectedSockets += 1;
              if (connectedSockets === 2) {
                window.clearTimeout(handshakeTimer);
                reconnectAttempt = 0;
                setRealtimeStatus("CONNECTED");
                void refreshLive();
              }
            };
            socket.onmessage = (event) => {
              if (disposed || ownGeneration !== generation) return;
              let eventType = "";
              try {
                eventType =
                  (JSON.parse(String(event.data)) as { type?: string }).type ??
                  "";
              } catch {
                /* a malformed realtime hint still triggers a live reconciliation */
              }
              window.clearTimeout(realtimeRefresh);
              realtimeRefresh = window.setTimeout(() => {
                void refreshLive();
                if (
                  ["MATCH_RESULT", "DUEL_RESULT_VERIFIED"].includes(eventType)
                ) {
                  void loadAccount();
                  const query = historyQuery.current;
                  if (query) void loadHistory(query.page, query.filters);
                }
              }, 250);
            };
            socket.onerror = () => {
              if (socket.readyState !== WebSocket.CLOSED) socket.close();
            };
            socket.onclose = () => {
              if (!disposed && ownGeneration === generation)
                scheduleReconnect();
            };
            return socket;
          },
        );
        handshakeTimer = window.setTimeout(() => {
          if (ownGeneration === generation && connectedSockets !== 2)
            scheduleReconnect();
        }, 10_000);
      } catch {
        scheduleReconnect();
      }
    };

    realtimeRetryRef.current = () => {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      scheduleReconnect(true);
    };
    void connect();
    let lastFallback = 0;
    const fallback = window.setInterval(() => {
      const now = Date.now();
      const interval = connectedSockets === 2 ? 30_000 : 15_000;
      if (
        document.visibilityState === "visible" &&
        navigator.onLine !== false &&
        now - lastFallback >= interval
      ) {
        lastFallback = now;
        void refreshLive();
      }
    }, 15_000);
    const reconnectWhenVisible = () => {
      if (
        document.visibilityState === "visible" &&
        connectedSockets !== 2 &&
        reconnectTimer === undefined
      )
        scheduleReconnect(true);
    };
    const reconnectWhenOnline = () => scheduleReconnect(true);
    const pauseWhenOffline = () => {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
      generation += 1;
      disposeSockets();
      setRealtimeStatus("OFFLINE");
    };
    document.addEventListener("visibilitychange", reconnectWhenVisible);
    window.addEventListener("online", reconnectWhenOnline);
    window.addEventListener("offline", pauseWhenOffline);
    const presence = window.setInterval(() => {
      void authenticatedFetch("/api/v2/players/me/presence", { method: "POST" })
        .then((response) =>
          response.ok ? (response.json() as Promise<PlayerProfile>) : undefined,
        )
        .then((updated) => {
          if (updated) setProfile(updated);
        })
        .catch(() => undefined);
    }, 60_000);
    return () => {
      disposed = true;
      disposeSockets();
      window.clearTimeout(reconnectTimer);
      window.clearTimeout(handshakeTimer);
      window.clearTimeout(realtimeRefresh);
      window.clearInterval(fallback);
      window.clearInterval(presence);
      document.removeEventListener("visibilitychange", reconnectWhenVisible);
      window.removeEventListener("online", reconnectWhenOnline);
      window.removeEventListener("offline", pauseWhenOffline);
      realtimeRetryRef.current = () => undefined;
    };
  }, [loadAccount, loadHistory, loadLive, session]);

  useEffect(() => {
    if (!session || !isBotDuel(lobby)) return;
    const startWatcher = async () => {
      if (botWatcherStarted.current === lobby.matchId) return;
      try {
        const response = await watcherFetch(
          "/v1/bot-duels/start",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              matchId: lobby.matchId,
            }),
          },
          true,
        );
        if (response.ok || response.status === 409)
          botWatcherStarted.current = lobby.matchId;
      } catch {
        setError(
          "Lance Showdown Watcher pour créer automatiquement le lobby League.",
        );
      }
    };
    void startWatcher();
    const timer = window.setInterval(async () => {
      await refreshWatcher();
      try {
        const status = await watcherFetch("/v1/duels/status", {}, true);
        if (!status.ok) return;
        const job = (await status.json()) as WatcherJob;
        if (job.matchId !== lobby.matchId || !job.outcome) return;
        window.clearInterval(timer);
        botWatcherStarted.current = null;
        await refresh();
      } catch {
        /* retry until the match disappears */
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [lobby, refresh, refreshWatcher, session]);

  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      fallback: string,
      successMessage?: string,
    ): Promise<T | null> => {
      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        const result = await operation();
        if (successMessage) setNotice(successMessage);
        return result;
      } catch (cause) {
        setError(friendlyError(cause, fallback));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [],
  );
  const login = useCallback(async () => {
    setError(null);
    await beginLogin();
  }, []);
  const logout = useCallback(() => {
    if (logoutInFlight.current) return logoutInFlight.current;
    const presenceController = new AbortController();
    const presenceTimer = window.setTimeout(
      () => presenceController.abort(),
      800,
    );
    const presence = authenticatedFetch("/api/v2/players/me/presence", {
      method: "DELETE",
      signal: presenceController.signal,
    })
      .catch(() => undefined)
      .finally(() => window.clearTimeout(presenceTimer));
    // The interface and local credentials are invalidated immediately. The
    // presence update is only a bounded best-effort cleanup.
    clearAuthenticatedState();
    const operation = Promise.resolve(signOut()).finally(() => void presence);
    const tracked = operation.finally(() => {
      if (logoutInFlight.current === tracked) logoutInFlight.current = null;
    });
    logoutInFlight.current = tracked;
    return tracked;
  }, [clearAuthenticatedState]);
  const dismissError = useCallback(() => setError(null), []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const joinQueue = useCallback(
    async (mode: ApiMode, primaryRole: ApiRole, secondaryRole: ApiRole) => {
      if (!session) {
        await login();
        return false;
      }
      if (joinQueueInFlight.current) return joinQueueInFlight.current;
      const region = party?.region ?? profile?.region ?? "EUW";
      const fingerprint = [
        mode,
        region,
        primaryRole,
        secondaryRole,
        party?.partyId ?? "solo",
      ].join(":");
      if (queueCommand.current?.fingerprint !== fingerprint)
        queueCommand.current = { fingerprint, key: crypto.randomUUID() };
      const idempotencyKey = queueCommand.current.key;
      const operation = (async () =>
        (await execute(
          async () => {
            if (mode === "ONE_V_ONE" && (!watcherOnline || !profile?.riotId))
              throw new Error(
                "Connecte le Watcher et lie ton Riot ID avant un duel classé.",
              );
            if (party) {
              if (mode === "ONE_V_ONE")
                throw new Error(
                  "Quitte le groupe pour lancer une recherche 1v1.",
                );
              if (!party.viewerIsLeader)
                throw new Error(
                  "Seul le chef du groupe peut lancer la recherche.",
                );
              if (!party.allReady)
                throw new Error(
                  "Tous les membres du groupe doivent être prêts.",
                );
              const response = await authenticatedFetch(
                "/api/v2/parties/current/search",
                {
                  method: "POST",
                  headers: { "Idempotency-Key": idempotencyKey },
                },
              );
              if (!response.ok)
                throw new Error(
                  await errorMessage(response, "Recherche du groupe refusée."),
                );
              const nextParty = (await response.json()) as PartySnapshot;
              setParty(nextParty);
              setQueue({
                queueEntryId: `party:${party.partyId}`,
                playerId: session.playerId,
                partyId: party.partyId,
                region,
                mode: "FIVE_V_FIVE",
                primaryRole,
                secondaryRole,
                mmr: statistics?.mmr ?? 1200,
                status: "QUEUED",
                joinedAt: new Date().toISOString(),
                reservationId: null,
              });
            } else {
              const response = await authenticatedFetch(
                "/api/v2/matchmaking/queue",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Idempotency-Key": idempotencyKey,
                  },
                  body: JSON.stringify({
                    region,
                    mode,
                    primaryRole,
                    secondaryRole,
                  }),
                },
              );
              if (!response.ok)
                throw new Error(
                  await errorMessage(
                    response,
                    `Impossible de rejoindre la file (${response.status}).`,
                  ),
                );
              setQueue((await response.json()) as QueueEntry);
            }
            // A successful command is authoritative. Reconciliation can be
            // retried in the background without turning success into failure.
            void loadLive().catch(() => undefined);
            queueCommand.current = null;
            return true;
          },
          "Impossible de rejoindre la file.",
          "Recherche lancée.",
        )) === true)();
      const tracked = operation.finally(() => {
        if (joinQueueInFlight.current === tracked)
          joinQueueInFlight.current = null;
      });
      joinQueueInFlight.current = tracked;
      return tracked;
    },
    [
      execute,
      loadLive,
      login,
      party,
      profile,
      session,
      statistics?.mmr,
      watcherOnline,
    ],
  );

  const leaveQueue = useCallback(async () => {
    await execute(
      async () => {
        const response = await authenticatedFetch(
          queue?.partyId
            ? "/api/v2/parties/current/search"
            : "/api/v2/matchmaking/queue",
          { method: "DELETE" },
        );
        if (!response.ok && response.status !== 404)
          throw new Error("Impossible de quitter la file.");
        setQueue(null);
        queueCommand.current = null;
        await loadLive();
      },
      "Impossible de quitter la file.",
      "Recherche annulée.",
    );
  }, [execute, loadLive, queue]);
  const answerReady = useCallback(
    async (accepted: boolean) => {
      if (!match) return false;
      return (
        (await execute(
          async () => {
            const response = await authenticatedFetch(
              `/api/v2/matches/${match.matchId}/ready`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accepted }),
              },
            );
            if (!response.ok)
              throw new Error(
                await errorMessage(response, "Réponse au ready-check refusée."),
              );
            setMatch((await response.json()) as CurrentMatch);
            await loadLive();
            return true;
          },
          "Réponse impossible.",
          accepted ? "Match accepté." : "Match refusé.",
        )) === true
      );
    },
    [execute, loadLive, match],
  );
  const updateProfile = useCallback(
    async (value: ProfileUpdate) =>
      (await execute(
        async () => {
          const response = await authenticatedFetch("/api/v2/players/me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(value),
          });
          if (!response.ok)
            throw new Error(await errorMessage(response, "Profil refusé."));
          setProfile((await response.json()) as PlayerProfile);
          return true;
        },
        "Impossible de modifier le profil.",
        "Profil enregistré.",
      )) === true,
    [execute],
  );
  const linkRiotId = useCallback(
    async () =>
      (await execute(
        async () => {
          const challengeResponse = await authenticatedFetch(
            "/api/v2/players/me/riot-link-challenges",
            { method: "POST" },
          );
          if (!challengeResponse.ok)
            throw new Error(
              await errorMessage(challengeResponse, "Challenge Riot refusé."),
            );
          const challenge = (await challengeResponse.json()) as {
            challengeId: string;
            expiresAt: string;
          };
          const watcher = await watcherFetch("/v1/identity", {}, true);
          if (!watcher.ok)
            throw new Error(
              await errorMessage(
                watcher,
                "Le Watcher n’a pas pu attester le Riot ID.",
              ),
            );
          const identity = (await watcher.json()) as {
            puuid: string;
            gameName: string;
            tagLine: string;
            profileIconId: number;
            summonerLevel: number;
          };
          const completion = await authenticatedFetch(
            `/api/v2/players/me/riot-link-challenges/${encodeURIComponent(challenge.challengeId)}/complete`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(identity),
            },
          );
          if (!completion.ok)
            throw new Error(
              await errorMessage(
                completion,
                "Le serveur a refusé la liaison Riot ID.",
              ),
            );
          await refresh();
          await refreshWatcher();
          return true;
        },
        "Impossible de lier le Riot ID.",
        "Riot ID lié au profil.",
      )) === true,
    [execute, refresh, refreshWatcher],
  );
  const createParty = useCallback(async () => {
    await execute(
      async () => {
        const response = await authenticatedFetch("/api/v2/parties", {
          method: "POST",
        });
        if (!response.ok)
          throw new Error(await errorMessage(response, "Création refusée."));
        setParty((await response.json()) as PartySnapshot);
      },
      "Impossible de créer le groupe.",
      "Groupe créé.",
    );
  }, [execute]);
  const invitePlayer = useCallback(
    async (displayName: string) =>
      (await execute(
        async () => {
          const response = await authenticatedFetch(
            "/api/v2/parties/current/invitations",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ displayName }),
            },
          );
          if (!response.ok)
            throw new Error(
              await errorMessage(response, "Invitation refusée."),
            );
          setParty((await response.json()) as PartySnapshot);
          return true;
        },
        "Invitation impossible.",
        "Invitation envoyée.",
      )) === true,
    [execute],
  );
  const setPartyReady = useCallback(
    async (ready: boolean) => {
      await execute(
        async () => {
          const response = await authenticatedFetch(
            "/api/v2/parties/current/ready",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ready }),
            },
          );
          if (!response.ok)
            throw new Error(await errorMessage(response, "Statut refusé."));
          setParty((await response.json()) as PartySnapshot);
        },
        "Statut impossible.",
        ready ? "Tu es prêt." : "Tu n’es plus prêt.",
      );
    },
    [execute],
  );
  const leaveParty = useCallback(async () => {
    await execute(
      async () => {
        const response = await authenticatedFetch("/api/v2/parties/current", {
          method: "DELETE",
        });
        if (!response.ok && response.status !== 204)
          throw new Error("Impossible de quitter le groupe.");
        setParty(null);
      },
      "Impossible de quitter le groupe.",
      "Groupe quitté.",
    );
  }, [execute]);
  const removePartyMember = useCallback(
    async (playerId: string) => {
      await execute(
        async () => {
          const response = await authenticatedFetch(
            `/api/v2/parties/current/members/${playerId}`,
            { method: "DELETE" },
          );
          if (!response.ok)
            throw new Error(
              await errorMessage(response, "Impossible de retirer ce joueur."),
            );
          setParty((await response.json()) as PartySnapshot);
        },
        "Impossible de retirer ce joueur.",
        "Joueur retiré du groupe.",
      );
    },
    [execute],
  );
  const respondPartyInvitation = useCallback(
    async (id: string, accepted: boolean) => {
      await execute(
        async () => {
          const response = await authenticatedFetch(
            `/api/v2/parties/invitations/${id}/${accepted ? "accept" : "decline"}`,
            { method: "POST" },
          );
          if (!response.ok && response.status !== 204)
            throw new Error("Réponse à l’invitation refusée.");
          if (accepted) setParty((await response.json()) as PartySnapshot);
          setInvitations((current) =>
            current.filter((value) => value.invitationId !== id),
          );
        },
        "Réponse impossible.",
        accepted ? "Invitation acceptée." : "Invitation déclinée.",
      );
    },
    [execute],
  );

  const loadMatchDetail = useCallback(
    async (matchId: string) => {
      const owner = readSession()?.playerId;
      if (!owner) return null;
      const sequence = ++detailRequestSequence.current;
      detailAbort.current?.abort();
      const controller = new AbortController();
      detailAbort.current = controller;
      try {
        const response = await authenticatedFetch(
          `/api/v2/matches/history/${matchId}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(await errorMessage(response, "Détail indisponible."));
        const payload: unknown = await response.json();
        if (!isMatchDetail(payload))
          throw new Error("Le serveur a renvoyé un détail invalide.");
        const detail = payload;
        if (
          sequence !== detailRequestSequence.current ||
          controller.signal.aborted ||
          readSession()?.playerId !== owner
        )
          return null;
        void resolveNames(
          [...detail.teammates, ...detail.opponents]
            .filter((p) => !p.bot)
            .map((p) => p.playerId),
        ).catch(() => undefined);
        return detail;
      } catch (cause) {
        if (
          controller.signal.aborted ||
          sequence !== detailRequestSequence.current
        )
          return null;
        setError(friendlyError(cause, "Détail indisponible."));
        return null;
      } finally {
        if (detailAbort.current === controller) detailAbort.current = null;
      }
    },
    [resolveNames],
  );
  const loadLeaderboards = useCallback(
    async (region: string) => {
      await fetchLeaderboards(region);
    },
    [fetchLeaderboards],
  );
  const retry = useCallback(async () => {
    setError(null);
    await Promise.all([refresh(), refreshWatcher()]);
  }, [refresh, refreshWatcher]);
  const visibleWatcherJob =
    watcherJob &&
    watcherJob.matchId &&
    ![match?.matchId, lobby?.matchId].includes(watcherJob.matchId) &&
    ["COMPLETED", "ERROR"].includes(watcherJob.state)
      ? null
      : watcherJob;

  const value = useMemo<BackendState>(
    () => ({
      session: session
        ? { playerId: session.playerId, username: session.username }
        : null,
      sessionStatus,
      profile,
      party,
      invitations,
      queue,
      match,
      lobby,
      history: historyPage?.content ?? [],
      recentHistory,
      historyPage,
      historyStatus,
      historyError,
      statistics,
      duelStatistics,
      fiveLeaderboard,
      duelLeaderboard,
      fiveLeaderboardSnapshot,
      duelLeaderboardSnapshot,
      leaderboardRegion,
      leaderboardSeason,
      leaderboardStatus,
      leaderboardError,
      ratingSeasons,
      playerNames,
      watcherOnline,
      watcherJob: visibleWatcherJob,
      backendOnline,
      realtimeStatus,
      busy,
      error,
      notice,
      dismissError,
      dismissNotice,
      retry,
      retryRealtime,
      login,
      logout,
      refresh,
      joinQueue,
      leaveQueue,
      answerReady,
      updateProfile,
      linkRiotId,
      createParty,
      invitePlayer,
      setPartyReady,
      removePartyMember,
      leaveParty,
      respondPartyInvitation,
      refreshWatcher,
      loadHistory,
      loadMatchDetail,
      loadLeaderboards,
    }),
    [
      session,
      sessionStatus,
      profile,
      party,
      invitations,
      queue,
      match,
      lobby,
      historyPage,
      recentHistory,
      historyStatus,
      historyError,
      statistics,
      duelStatistics,
      fiveLeaderboard,
      duelLeaderboard,
      fiveLeaderboardSnapshot,
      duelLeaderboardSnapshot,
      leaderboardRegion,
      leaderboardSeason,
      leaderboardStatus,
      leaderboardError,
      ratingSeasons,
      playerNames,
      watcherOnline,
      visibleWatcherJob,
      backendOnline,
      realtimeStatus,
      busy,
      error,
      notice,
      dismissError,
      dismissNotice,
      retry,
      retryRealtime,
      login,
      logout,
      refresh,
      joinQueue,
      leaveQueue,
      answerReady,
      updateProfile,
      linkRiotId,
      createParty,
      invitePlayer,
      setPartyReady,
      removePartyMember,
      leaveParty,
      respondPartyInvitation,
      refreshWatcher,
      loadHistory,
      loadMatchDetail,
      loadLeaderboards,
    ],
  );
  return (
    <BackendContext.Provider value={value}>{children}</BackendContext.Provider>
  );
}

export function useBackend() {
  const value = useContext(BackendContext);
  if (!value) throw new Error("useBackend must be used inside BackendProvider");
  return value;
}
