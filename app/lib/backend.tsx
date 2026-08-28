'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiPath, authenticatedFetch, beginLogin, completeLogin, readSession, signOut, type UserSession } from './auth';

export type ApiRole = 'TOP' | 'JUNGLE' | 'MID' | 'BOT' | 'SUPPORT';
export type ApiMode = 'ONE_V_ONE' | 'FIVE_V_FIVE';
export type PlayerProfile = { playerId: string; displayName: string; region: string; primaryRole: ApiRole; secondaryRole: ApiRole; riotId: string | null; online: boolean };
export type PartyMember = { playerId: string; displayName: string; primaryRole: ApiRole; secondaryRole: ApiRole; ready: boolean; online: boolean; simulated: boolean };
export type PartySnapshot = { partyId: string; leaderId: string; region: string; viewerIsLeader: boolean; allReady: boolean; capacity: number; members: PartyMember[] };
export type QueueEntry = { queueEntryId: string; playerId: string; partyId: string | null; region: string; mode: ApiMode; primaryRole: ApiRole; secondaryRole: ApiRole; mmr: number; status: 'QUEUED' | 'RESERVED'; joinedAt: string; reservationId: string | null };
export type MatchPlayer = { playerId: string; team: 'BLUE' | 'RED'; readyState: 'PENDING' | 'ACCEPTED' | 'DECLINED'; bot: boolean; assignedRole: ApiRole };
export type CurrentMatch = { matchId: string; region: string; mode: ApiMode; status: 'READY_CHECK' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED'; createdAt: string; readyDeadline: string; lobbyName: string | null; lobbyPassword: string | null; winningTeam: 'BLUE' | 'RED' | null; players: MatchPlayer[] };
export type HistoryEntry = { matchId: string; region: string; mode: ApiMode; outcome: 'VICTORY' | 'DEFEAT'; team: 'BLUE' | 'RED'; role: ApiRole; playedAt: string; previousMmr: number; mmrDelta: number; newMmr: number };
export type MatchStatistics = { mmr: number; peakMmr: number; skillMean: number; skillDeviation: number; season: string; region: string; placementGamesRemaining: number; progression: number; rank: string; games: number; wins: number; losses: number; winRate: number; gamesByRole: Partial<Record<ApiRole, number>>; recentForm: string[] };
export type DuelStatistics = { mmr: number; peakMmr: number; rating: number; games: number; wins: number; losses: number; winRate: number; progression: number };
export type LadderEntry = { position: number; playerId: string; mmr: number; rank?: string; games: number; wins: number; winRate: number; progression: number };

type BackendState = {
  session: UserSession | null;
  profile: PlayerProfile | null;
  party: PartySnapshot | null;
  queue: QueueEntry | null;
  match: CurrentMatch | null;
  lobby: CurrentMatch | null;
  history: HistoryEntry[];
  statistics: MatchStatistics | null;
  duelStatistics: DuelStatistics | null;
  fiveLeaderboard: LadderEntry[];
  duelLeaderboard: LadderEntry[];
  playerNames: Record<string, string>;
  backendOnline: boolean | null;
  busy: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  joinQueue: (mode: ApiMode, primary: ApiRole, secondary: ApiRole) => Promise<boolean>;
  leaveQueue: () => Promise<void>;
  answerReady: (accepted: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const BackendContext = createContext<BackendState | null>(null);

async function jsonOrNull<T>(path: string): Promise<T | null> {
  const response = await authenticatedFetch(path);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [party, setParty] = useState<PartySnapshot | null>(null);
  const [queue, setQueue] = useState<QueueEntry | null>(null);
  const [match, setMatch] = useState<CurrentMatch | null>(null);
  const [lobby, setLobby] = useState<CurrentMatch | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [statistics, setStatistics] = useState<MatchStatistics | null>(null);
  const [duelStatistics, setDuelStatistics] = useState<DuelStatistics | null>(null);
  const [fiveLeaderboard, setFiveLeaderboard] = useState<LadderEntry[]>([]);
  const [duelLeaderboard, setDuelLeaderboard] = useState<LadderEntry[]>([]);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLive = useCallback(async () => {
    if (!readSession()) return;
    const [nextQueue, nextMatch, nextLobby, nextParty] = await Promise.all([
      jsonOrNull<QueueEntry>('/api/v2/matchmaking/queue'),
      jsonOrNull<CurrentMatch>('/api/v2/matches/current'),
      jsonOrNull<CurrentMatch>('/api/v2/matches/current-lobby'),
      jsonOrNull<PartySnapshot>('/api/v2/parties/current'),
    ]);
    setQueue(nextQueue); setMatch(nextMatch); setLobby(nextLobby); setParty(nextParty);
  }, []);

  const loadAccount = useCallback(async () => {
    if (!readSession()) return;
    const nextProfile = await jsonOrNull<PlayerProfile>('/api/v2/players/me');
    setProfile(nextProfile);
    const region = nextProfile?.region ?? 'EUW';
    const [historyResponse, stats, duelStats, five, duel] = await Promise.all([
      authenticatedFetch('/api/v2/matches/history?page=0&size=25'),
      jsonOrNull<MatchStatistics>(`/api/v2/matches/statistics?region=${region}`),
      jsonOrNull<DuelStatistics>(`/api/v2/matches/duel/statistics?region=${region}`),
      jsonOrNull<{ entries: LadderEntry[] }>(`/api/v2/matches/leaderboard?region=${region}&limit=50`),
      jsonOrNull<{ entries: LadderEntry[] }>(`/api/v2/matches/duel/leaderboard?region=${region}&limit=50`),
    ]);
    if (historyResponse.ok) setHistory(((await historyResponse.json()) as { content: HistoryEntry[] }).content);
    setStatistics(stats); setDuelStatistics(duelStats);
    setFiveLeaderboard(five?.entries ?? []); setDuelLeaderboard(duel?.entries ?? []);
    const ids = [...new Set([...(five?.entries ?? []), ...(duel?.entries ?? [])].map((entry) => entry.playerId))];
    if (ids.length) {
      const response = await authenticatedFetch(`/api/v2/players/directory?ids=${encodeURIComponent(ids.join(','))}`);
      if (response.ok) {
        const players = await response.json() as Array<{ playerId: string; displayName: string }>;
        setPlayerNames(Object.fromEntries(players.map((player) => [player.playerId, player.displayName])));
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!readSession()) return;
    setError(null);
    try { await Promise.all([loadLive(), loadAccount()]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Le backend ne répond pas.'); }
  }, [loadAccount, loadLive]);

  useEffect(() => {
    fetch(apiPath('/actuator/health/readiness'))
      .then((response) => { setBackendOnline(response.ok); })
      .catch(() => setBackendOnline(false));
    completeLogin()
      .then((connected) => { setSession(connected); if (connected) return refresh(); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Connexion impossible.'));
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    const poll = window.setInterval(() => { void loadLive().catch(() => setBackendOnline(false)); }, 3000);
    const heartbeat = window.setInterval(() => {
      void authenticatedFetch('/api/v2/players/me/presence', { method: 'POST' }).then((response) => {
        if (response.ok) return response.json() as Promise<PlayerProfile>;
      }).then((updated) => { if (updated) setProfile(updated); }).catch(() => undefined);
    }, 20_000);
    return () => { window.clearInterval(poll); window.clearInterval(heartbeat); };
  }, [loadLive, session]);

  const login = useCallback(async () => { setError(null); await beginLogin(); }, []);
  const logout = useCallback(async () => {
    try { await authenticatedFetch('/api/v2/players/me/presence', { method: 'DELETE' }); } catch { /* local logout remains valid */ }
    signOut(); setSession(null); setProfile(null); setParty(null); setQueue(null); setMatch(null); setLobby(null);
  }, []);

  const joinQueue = useCallback(async (mode: ApiMode, primary: ApiRole, secondary: ApiRole) => {
    if (!session) { await login(); return false; }
    setBusy(true); setError(null);
    try {
      const response = await authenticatedFetch('/api/v2/matchmaking/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ region: profile?.region ?? 'EUW', mode, primaryRole: primary, secondaryRole: secondary }),
      });
      if (response.status === 403) {
        signOut();
        setSession(null);
        await beginLogin(true);
        return false;
      }
      if (!response.ok) throw new Error(`Impossible de rejoindre la file (${response.status}).`);
      setQueue(await response.json() as QueueEntry);
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible.'); return false; }
    finally { setBusy(false); }
  }, [login, profile, session]);

  const leaveQueue = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const path = queue?.partyId ? '/api/v2/parties/current/search' : '/api/v2/matchmaking/queue';
      const response = await authenticatedFetch(path, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) throw new Error('Impossible de quitter la file.');
      setQueue(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible.'); }
    finally { setBusy(false); }
  }, [queue]);

  const answerReady = useCallback(async (accepted: boolean) => {
    if (!match) return;
    setBusy(true); setError(null);
    try {
      const response = await authenticatedFetch(`/api/v2/matches/${match.matchId}/ready`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accepted }),
      });
      if (!response.ok) throw new Error('Réponse au ready-check refusée.');
      setMatch(await response.json() as CurrentMatch);
      await loadLive();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible.'); }
    finally { setBusy(false); }
  }, [loadLive, match]);

  const value = useMemo<BackendState>(() => ({ session, profile, party, queue, match, lobby, history, statistics,
    duelStatistics, fiveLeaderboard, duelLeaderboard, playerNames, backendOnline, busy, error,
    login, logout, joinQueue, leaveQueue, answerReady, refresh }),
  [session, profile, party, queue, match, lobby, history, statistics, duelStatistics, fiveLeaderboard,
    duelLeaderboard, playerNames, backendOnline, busy, error, login, logout, joinQueue, leaveQueue, answerReady, refresh]);
  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}

export function useBackend() {
  const value = useContext(BackendContext);
  if (!value) throw new Error('useBackend must be used inside BackendProvider');
  return value;
}
