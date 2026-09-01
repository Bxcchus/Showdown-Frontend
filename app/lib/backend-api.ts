import { authenticatedFetch } from "./auth";
import type {
  CurrentMatch,
  HistoryEntry,
  HistoryPage,
  LadderEntry,
  LeaderboardSnapshot,
  MatchDetail,
} from "./backend-types";

export async function jsonOrNull<T>(path: string): Promise<T | null | undefined> {
  const response = await authenticatedFetch(path);
  if (response.status === 404) return null;
  // A background refresh must never erase the last good state or crash the UI
  // when the gateway temporarily rate-limits a burst of realtime events.
  if (response.status === 429) return undefined;
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

export async function errorMessage(response: Response, fallback: string) {
  try {
    const value = (await response.json()) as {
      detail?: string;
      error?: string;
      message?: string;
    };
    return value.detail ?? value.error ?? value.message ?? fallback;
  } catch {
    return fallback;
  }
}

function abortableDelay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function retryAfterMilliseconds(response: Response, attempt: number) {
  const value = response.headers.get("retry-after");
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds))
      return Math.min(2_000, Math.max(0, seconds * 1_000));
    const date = Date.parse(value);
    if (Number.isFinite(date))
      return Math.min(2_000, Math.max(0, date - Date.now()));
  }
  return 300 * (attempt + 1);
}

export async function fetchHistoryResponse(path: string, signal: AbortSignal) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await authenticatedFetch(path, { signal });
      if (attempt === 0 && [429, 502, 503, 504].includes(response.status)) {
        await abortableDelay(retryAfterMilliseconds(response, attempt), signal);
        continue;
      }
      return response;
    } catch (cause) {
      if (signal.aborted || attempt > 0) throw cause;
      await abortableDelay(300, signal);
    }
  }
  throw new Error("Historique indisponible.");
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<HistoryEntry>;
  return (
    typeof item.matchId === "string" &&
    typeof item.region === "string" &&
    ["ONE_V_ONE", "FIVE_V_FIVE"].includes(String(item.mode)) &&
    ["VICTORY", "DEFEAT"].includes(String(item.outcome)) &&
    ["BLUE", "RED"].includes(String(item.team)) &&
    ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"].includes(String(item.role)) &&
    (item.championName == null || typeof item.championName === "string") &&
    typeof item.playedAt === "string" &&
    Number.isFinite(Date.parse(item.playedAt)) &&
    typeof item.previousMmr === "number" &&
    Number.isFinite(item.previousMmr) &&
    typeof item.newMmr === "number" &&
    Number.isFinite(item.newMmr) &&
    typeof item.mmrDelta === "number" &&
    Number.isFinite(item.mmrDelta)
  );
}

export function isHistoryPage(value: unknown): value is HistoryPage {
  if (!value || typeof value !== "object") return false;
  const page = value as Partial<HistoryPage>;
  return (
    Array.isArray(page.content) &&
    page.content.every(isHistoryEntry) &&
    Number.isInteger(page.page) &&
    Number.isInteger(page.size) &&
    Number.isInteger(page.totalElements) &&
    Number.isInteger(page.totalPages) &&
    typeof page.hasPrevious === "boolean" &&
    typeof page.hasNext === "boolean"
  );
}

export function isMatchDetail(value: unknown): value is MatchDetail {
  if (!value || typeof value !== "object") return false;
  const detail = value as Partial<MatchDetail>;
  const isParticipant = (participant: unknown) => {
    if (!participant || typeof participant !== "object") return false;
    const item = participant as MatchDetail["teammates"][number];
    return (
      typeof item.playerId === "string" &&
      ["BLUE", "RED"].includes(item.team) &&
      ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"].includes(item.role) &&
      typeof item.bot === "boolean" &&
      typeof item.self === "boolean"
    );
  };
  return (
    isHistoryEntry(detail.summary) &&
    Array.isArray(detail.teammates) &&
    detail.teammates.every(isParticipant) &&
    Array.isArray(detail.opponents) &&
    detail.opponents.every(isParticipant)
  );
}

function isLadderEntry(value: unknown): value is LadderEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<LadderEntry>;
  return (
    Number.isInteger(entry.position) &&
    typeof entry.playerId === "string" &&
    typeof entry.mmr === "number" &&
    Number.isFinite(entry.mmr) &&
    Number.isInteger(entry.games) &&
    Number.isInteger(entry.wins) &&
    typeof entry.winRate === "number" &&
    Number.isFinite(entry.winRate) &&
    typeof entry.progression === "number" &&
    Number.isFinite(entry.progression)
  );
}

export function isLeaderboardSnapshot(value: unknown): value is LeaderboardSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<LeaderboardSnapshot>;
  return (
    typeof snapshot.season === "string" &&
    typeof snapshot.region === "string" &&
    typeof snapshot.startsAt === "string" &&
    Number.isFinite(Date.parse(snapshot.startsAt)) &&
    typeof snapshot.endsAt === "string" &&
    Number.isFinite(Date.parse(snapshot.endsAt)) &&
    Number.isInteger(snapshot.placementGames) &&
    Number.isInteger(snapshot.totalEntries) &&
    snapshot.totalEntries! >= 0 &&
    (snapshot.viewer === null || isLadderEntry(snapshot.viewer)) &&
    Array.isArray(snapshot.entries) &&
    snapshot.entries.every(isLadderEntry)
  );
}

export function friendlyError(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message : fallback;
  if (/API 429|429/.test(message))
    return "Trop de demandes ont été envoyées. GYMS.LOL réessaiera automatiquement dans quelques secondes.";
  if (/Failed to fetch|NetworkError|fetch failed/i.test(message))
    return "Connexion impossible. Vérifie que le backend local et Docker sont démarrés.";
  if (/401|Connexion requise/i.test(message))
    return "Ta session a expiré. Reconnecte-toi pour continuer.";
  if (/403|Forbidden/i.test(message))
    return "Cette action n’est pas autorisée pour ton compte.";
  return message || fallback;
}

export function isBotDuel(match: CurrentMatch | null): match is CurrentMatch {
  return Boolean(
    match?.mode === "ONE_V_ONE" && match.players.some((player) => player.bot),
  );
}
