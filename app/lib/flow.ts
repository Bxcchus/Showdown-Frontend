import type { ApiMode, ApiRole, CurrentMatch } from "./backend";
import type { Page } from "./navigation";

export type FlowSnapshot = {
  hasLobby: boolean;
  matchStatus: CurrentMatch["status"] | null;
  hasQueue: boolean;
};

export function activeFlowPage(
  requestedPage: Page,
  snapshot: FlowSnapshot,
): Page {
  const flowPage = snapshot.hasLobby
    ? "lobby"
    : snapshot.matchStatus === "READY_CHECK"
      ? "ready"
      : snapshot.hasQueue
        ? "searching"
        : null;
  if (
    requestedPage === "play" ||
    requestedPage === "searching" ||
    requestedPage === "ready" ||
    requestedPage === "lobby"
  )
    return flowPage ?? "play";
  return requestedPage;
}

export type HistoryFilter = "ALL" | "1V1 GLICKO-2" | "5V5 TRUESKILL";
export type HistorySearchFilters = {
  mode: HistoryFilter;
  region: "" | "EUW" | "EUNE" | "NA";
  role: "" | ApiRole;
  outcome: "" | "VICTORY" | "DEFEAT";
  page: number;
};

export function historyFilterFromQuery(query: string): HistoryFilter {
  const value = new URLSearchParams(query).get("mode");
  return value === "1v1"
    ? "1V1 GLICKO-2"
    : value === "5v5"
      ? "5V5 TRUESKILL"
      : "ALL";
}

export function historyMode(filter: HistoryFilter): ApiMode | "" {
  return filter === "1V1 GLICKO-2"
    ? "ONE_V_ONE"
    : filter === "5V5 TRUESKILL"
      ? "FIVE_V_FIVE"
      : "";
}

export function historyFiltersFromQuery(query: string): HistorySearchFilters {
  const values = new URLSearchParams(query);
  const region = values.get("region")?.toUpperCase();
  const role = values.get("role")?.toUpperCase();
  const outcome = values.get("outcome")?.toUpperCase();
  const requestedPage = Number.parseInt(values.get("page") ?? "1", 10);
  return {
    mode: historyFilterFromQuery(query),
    region:
      region === "EUW" || region === "EUNE" || region === "NA" ? region : "",
    role:
      role === "TOP" ||
      role === "JUNGLE" ||
      role === "MID" ||
      role === "BOT" ||
      role === "SUPPORT"
        ? role
        : "",
    outcome: outcome === "VICTORY" || outcome === "DEFEAT" ? outcome : "",
    page:
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.min(10_000, requestedPage)
        : 1,
  };
}
