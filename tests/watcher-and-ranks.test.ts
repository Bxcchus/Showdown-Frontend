import { describe, expect, it } from "vitest";
import {
  duelRankPresentation,
  fiveRankPresentation,
  watcherPresentation,
} from "../app/lib/presentation";

describe("états du Watcher", () => {
  it("sépare la connexion du processus de l’échec du duel", () => {
    expect(watcherPresentation(false, null)).toMatchObject({
      label: "Hors ligne",
      tone: "neutral",
    });
    expect(
      watcherPresentation(true, {
        matchId: "m1",
        state: "ERROR",
        detail: "Client League absent",
        outcome: null,
        objective: null,
      }),
    ).toMatchObject({
      label: "Action requise",
      tone: "danger",
      description: "Client League absent",
    });
  });

  it("présente un résultat détecté comme un succès", () => {
    expect(
      watcherPresentation(true, {
        matchId: "m1",
        state: "COMPLETED",
        detail: null,
        outcome: "VICTORY",
        objective: "FIRST_BLOOD",
      }),
    ).toMatchObject({ label: "Résultat détecté", tone: "success" });
  });
});

describe("classements sans faux rang", () => {
  it("reste non classé sans partie en 5v5 et en 1v1", () => {
    expect(fiveRankPresentation(null).label).toBe("NON CLASSÉ");
    expect(duelRankPresentation(null).label).toBe("NON CLASSÉ");
  });
});
