import type { UserSession } from "./auth";

export type ApiRole = "TOP" | "JUNGLE" | "MID" | "BOT" | "SUPPORT";
export type ApiMode = "ONE_V_ONE" | "FIVE_V_FIVE";
export type PlayerProfile = {
  playerId: string;
  displayName: string;
  region: string;
  primaryRole: ApiRole;
  secondaryRole: ApiRole;
  onboardingComplete: boolean;
  riotId: string | null;
  riotProfileIconId: number | null;
  riotSummonerLevel: number | null;
  online: boolean;
};
export type PartyMember = {
  playerId: string;
  displayName: string;
  primaryRole: ApiRole;
  secondaryRole: ApiRole;
  ready: boolean;
  online: boolean;
  simulated: boolean;
};
export type PartySnapshot = {
  partyId: string;
  leaderId: string;
  region: string;
  viewerIsLeader: boolean;
  allReady: boolean;
  capacity: number;
  members: PartyMember[];
  invitations: Array<{
    invitationId: string;
    inviteeId: string;
    displayName: string;
    status: string;
    expiresAt: string;
  }>;
};
export type PartyInvitation = {
  invitationId: string;
  partyId: string;
  inviterDisplayName: string;
  region: string;
  expiresAt: string;
};
export type QueueEntry = {
  queueEntryId: string;
  playerId: string;
  partyId: string | null;
  region: string;
  mode: ApiMode;
  primaryRole: ApiRole;
  secondaryRole: ApiRole;
  mmr: number;
  status: "QUEUED" | "RESERVED";
  joinedAt: string;
  reservationId: string | null;
};
export type MatchPlayer = {
  playerId: string;
  team: "BLUE" | "RED";
  readyState: "PENDING" | "ACCEPTED" | "DECLINED";
  bot: boolean;
  assignedRole: ApiRole;
};
export type CurrentMatch = {
  matchId: string;
  region: string;
  mode: ApiMode;
  status: "READY_CHECK" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "COMPLETED";
  createdAt: string;
  readyDeadline: string;
  lobbyName: string | null;
  lobbyPassword: string | null;
  winningTeam: "BLUE" | "RED" | null;
  players: MatchPlayer[];
};
export type HistoryEntry = {
  matchId: string;
  region: string;
  mode: ApiMode;
  outcome: "VICTORY" | "DEFEAT";
  team: "BLUE" | "RED";
  role: ApiRole;
  playedAt: string;
  previousMmr: number;
  mmrDelta: number;
  newMmr: number;
};
export type HistoryPage = {
  content: HistoryEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};
export type HistoryRequest = {
  mode?: ApiMode | "";
  region?: string;
  role?: ApiRole | "";
  outcome?: "VICTORY" | "DEFEAT" | "";
};
export type HistoryLoadStatus = "IDLE" | "LOADING" | "READY" | "ERROR";
export type MatchParticipant = {
  playerId: string;
  team: "BLUE" | "RED";
  role: ApiRole;
  bot: boolean;
  self: boolean;
};
export type MatchDetail = {
  summary: HistoryEntry;
  teammates: MatchParticipant[];
  opponents: MatchParticipant[];
};
export type MatchStatistics = {
  mmr: number;
  peakMmr: number;
  skillMean: number;
  skillDeviation: number;
  season: string;
  region: string;
  placementGamesRemaining: number;
  progression: number;
  rank: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  gamesByRole: Partial<Record<ApiRole, number>>;
  recentForm: string[];
};
export type DuelStatistics = {
  mmr: number;
  peakMmr: number;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  algorithm: "GLICKO_2";
  season: string;
  region: string;
  placementGamesRemaining: number;
  provisional: boolean;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  progression: number;
};
export type LadderEntry = {
  position: number;
  playerId: string;
  mmr: number;
  rank?: string;
  ratingDeviation?: number;
  provisional?: boolean;
  games: number;
  wins: number;
  winRate: number;
  progression: number;
};
export type LeaderboardSnapshot = {
  season: string;
  region: string;
  startsAt: string;
  endsAt: string;
  placementGames: number;
  totalEntries: number;
  viewer: LadderEntry | null;
  entries: LadderEntry[];
};
export type LeaderboardLoadStatus = "IDLE" | "LOADING" | "READY" | "ERROR";
export type RatingSeasonInfo = {
  code: string;
  startsAt: string;
  endsAt: string;
  placementGames: number;
  resetFactor: number;
  active: boolean;
};
export type WatcherJob = {
  matchId: string | null;
  state: string;
  detail: string | null;
  outcome: "VICTORY" | "DEFEAT" | null;
  objective: string | null;
};
export type ProfileUpdate = Pick<
  PlayerProfile,
  "displayName" | "region" | "primaryRole" | "secondaryRole"
>;

export type SessionStatus = "LOADING" | "AUTHENTICATED" | "ANONYMOUS";
export type RealtimeStatus =
  "IDLE" | "CONNECTING" | "CONNECTED" | "RECONNECTING" | "OFFLINE";
export type PublicUserSession = Pick<UserSession, "playerId" | "username">;

export type BackendState = {
  session: PublicUserSession | null;
  sessionStatus: SessionStatus;
  profile: PlayerProfile | null;
  party: PartySnapshot | null;
  invitations: PartyInvitation[];
  queue: QueueEntry | null;
  match: CurrentMatch | null;
  lobby: CurrentMatch | null;
  history: HistoryEntry[];
  recentHistory: HistoryEntry[];
  historyPage: HistoryPage | null;
  historyStatus: HistoryLoadStatus;
  historyError: string | null;
  statistics: MatchStatistics | null;
  duelStatistics: DuelStatistics | null;
  fiveLeaderboard: LadderEntry[];
  duelLeaderboard: LadderEntry[];
  fiveLeaderboardSnapshot: LeaderboardSnapshot | null;
  duelLeaderboardSnapshot: LeaderboardSnapshot | null;
  leaderboardRegion: string;
  leaderboardSeason: LeaderboardSnapshot | null;
  leaderboardStatus: LeaderboardLoadStatus;
  leaderboardError: string | null;
  ratingSeasons: RatingSeasonInfo[];
  playerNames: Record<string, string>;
  watcherOnline: boolean;
  watcherJob: WatcherJob | null;
  backendOnline: boolean | null;
  realtimeStatus: RealtimeStatus;
  busy: boolean;
  error: string | null;
  notice: string | null;
  dismissError: () => void;
  dismissNotice: () => void;
  retry: () => Promise<void>;
  retryRealtime: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  joinQueue: (
    mode: ApiMode,
    primary: ApiRole,
    secondary: ApiRole,
  ) => Promise<boolean>;
  leaveQueue: () => Promise<void>;
  answerReady: (accepted: boolean) => Promise<boolean>;
  updateProfile: (profile: ProfileUpdate) => Promise<boolean>;
  linkRiotId: () => Promise<boolean>;
  createParty: () => Promise<void>;
  invitePlayer: (displayName: string) => Promise<boolean>;
  setPartyReady: (ready: boolean) => Promise<void>;
  removePartyMember: (playerId: string) => Promise<void>;
  leaveParty: () => Promise<void>;
  respondPartyInvitation: (id: string, accepted: boolean) => Promise<void>;
  refreshWatcher: () => Promise<void>;
  loadHistory: (
    page?: number,
    filters?: HistoryRequest,
  ) => Promise<HistoryPage | null>;
  loadMatchDetail: (matchId: string) => Promise<MatchDetail | null>;
  loadLeaderboards: (region: string) => Promise<void>;
};
