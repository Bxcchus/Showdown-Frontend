import { describe, expect, it } from "vitest";
import {
  activeFlowPage,
  historyFiltersFromQuery,
  historyFilterFromQuery,
  historyMode,
} from "../app/lib/flow";
import { pageFromPath } from "../app/lib/navigation";

describe("parcours de matchmaking 1v1", () => {
  it("enchaîne recherche, confirmation puis lobby", () => {
    expect(
      activeFlowPage("play", {
        hasQueue: true,
        matchStatus: null,
        hasLobby: false,
      }),
    ).toBe("searching");
    expect(
      activeFlowPage("searching", {
        hasQueue: true,
        matchStatus: "READY_CHECK",
        hasLobby: false,
      }),
    ).toBe("ready");
    expect(
      activeFlowPage("ready", {
        hasQueue: false,
        matchStatus: "CONFIRMED",
        hasLobby: true,
      }),
    ).toBe("lobby");
  });

  it("redirige les routes internes orphelines vers la sélection de file", () => {
    const empty = { hasQueue: false, matchStatus: null, hasLobby: false };
    expect(activeFlowPage("searching", empty)).toBe("play");
    expect(activeFlowPage("ready", empty)).toBe("play");
    expect(activeFlowPage("lobby", empty)).toBe("play");
  });

  it("laisse consulter le reste du site pendant une partie active", () => {
    expect(
      activeFlowPage("matches", {
        hasQueue: false,
        matchStatus: "CONFIRMED",
        hasLobby: true,
      }),
    ).toBe("matches");
  });
});

describe("parcours de matchmaking 5v5", () => {
  it("conserve les routes fonctionnelles et revient vers l’historique", () => {
    expect(pageFromPath("/play")).toBe("play");
    expect(
      activeFlowPage("play", {
        hasQueue: true,
        matchStatus: null,
        hasLobby: false,
      }),
    ).toBe("searching");
    expect(
      activeFlowPage("matches", {
        hasQueue: false,
        matchStatus: "COMPLETED",
        hasLobby: false,
      }),
    ).toBe("matches");
  });
});

describe("historique partageable", () => {
  it("restaure le filtre depuis l’URL", () => {
    expect(historyFilterFromQuery("?mode=1v1")).toBe("1V1 GLICKO-2");
    expect(historyFilterFromQuery("?mode=5v5")).toBe("5V5 TRUESKILL");
    expect(historyMode("1V1 GLICKO-2")).toBe("ONE_V_ONE");
    expect(historyMode("5V5 TRUESKILL")).toBe("FIVE_V_FIVE");
    expect(
      historyFiltersFromQuery(
        "?mode=1v1&region=euw&role=jungle&outcome=victory",
      ),
    ).toEqual({
      mode: "1V1 GLICKO-2",
      region: "EUW",
      role: "JUNGLE",
      outcome: "VICTORY",
      page: 1,
    });
  });

  it("conserve une page valide et normalise les valeurs invalides", () => {
    expect(historyFiltersFromQuery("?page=3").page).toBe(3);
    expect(historyFiltersFromQuery("?page=0").page).toBe(1);
    expect(historyFiltersFromQuery("?page=not-a-number").page).toBe(1);
  });
});
