import { describe, expect, it } from "vitest";
import { englishTranslations, translateFrench } from "../app/lib/i18n";
import { pageTitles } from "../app/lib/navigation";

describe("traduction anglaise", () => {
  it("traduit les libellés principaux sans modifier les noms de jeu", () => {
    expect(translateFrench("ACCUEIL")).toBe("HOME");
    expect(translateFrench("TROUVER UN MATCH")).toBe("FIND A MATCH");
    expect(translateFrench("HOWLING ABYSS")).toBe("HOWLING ABYSS");
  });

  it("traduit les contenus dynamiques", () => {
    expect(translateFrench("12 matchs chargés depuis Pinkward.")).toBe(
      "12 matches loaded from Pinkward.",
    );
    expect(translateFrench("Page 2 sur 5")).toBe("Page 2 of 5");
  });

  it("traduit tous les titres du navigateur", () => {
    const expected = {
      home: "Home · Pinkward",
      play: "Play · Pinkward",
      duels: "Watcher · Pinkward",
      searching: "Searching · Pinkward",
      ready: "Ready check · Pinkward",
      lobby: "Match lobby · Pinkward",
      matches: "Match history · Pinkward",
      leaderboard: "Leaderboard · Pinkward",
      download: "Download · Pinkward",
      profile: "Profile · Pinkward",
      settings: "Settings · Pinkward",
      legal: "Legal notice · Pinkward",
      privacy: "Privacy · Pinkward",
      terms: "Terms of use · Pinkward",
    };

    for (const [page, title] of Object.entries(pageTitles)) {
      expect(translateFrench(`${title} · Pinkward`), page).toBe(
        expected[page as keyof typeof expected],
      );
    }
    expect(translateFrench("Page introuvable · Pinkward")).toBe(
      "Page not found · Pinkward",
    );
  });

  it.each([
    ["RÉESSAYER", "RETRY"],
    ["SHOWDOWN CLASSÉ", "RANKED SHOWDOWN"],
    ["Classement actuel", "Current rank"],
    ["Classement CLASSÉ", "Rank RANKED"],
    ["Classement NON CLASSÉ", "Rank UNRANKED"],
    ["1 / 5 PRÊTS", "1 / 5 READY"],
    [" / 2 PRÊTS", " / 2 READY"],
    ["2 V — 1 D", "2 W — 1 L"],
    ["REFUSÉ", "DECLINED"],
    ["CONFIRMÉ", "CONFIRMED"],
    [
      "12 parties enregistrées par Pinkward.",
      "12 matches recorded by Pinkward.",
    ],
    ["Classé 5v5 · TrueSkill", "Ranked 5v5 · TrueSkill"],
    [
      "Les meilleurs joueurs Pinkward de la région EUW.",
      "The highest-rated Pinkward players in EUW.",
    ],
    ["Joueur 12ab34", "Player 12ab34"],
    ["Retirer local-player2 du groupe", "Remove local-player2 from the party"],
    [
      "Partie personnalisée 1v1 · EUW · Équipes et rôles attribués",
      "Custom 1v1 game · EUW · Assigned teams and roles",
    ],
    [
      "DERNIÈRE VERSION\u00a0\u00a0•\u00a0\u00a0V0.1.0 · 28/08/2026",
      "LATEST RELEASE • V0.1.0 · 28/08/2026",
    ],
    [
      "5,3 Mo\u00a0\u00a0•\u00a0\u00a0Exécutable portable",
      "5.3 MB • Portable executable",
    ],
    [
      "> Prêt à recevoir un duel Pinkward.",
      "> Ready to receive a Pinkward duel.",
    ],
    ["FIRST BLOOD · victoire", "FIRST BLOOD · victory"],
    ["3 restante(s)", "3 remaining"],
    ["0 partie", "0 matches"],
    ["ENREGISTREMENT…", "SAVING…"],
    ["Session locale du Watcher invalide.", "Invalid local Watcher session."],
  ])("traduit %s", (source, expected) => {
    expect(translateFrench(source)).toBe(expected);
  });

  it("gère correctement les pluriels anglais", () => {
    expect(translateFrench("1 match")).toBe("1 match");
    expect(translateFrench("1 joueur")).toBe("1 player");
    expect(translateFrench("2 joueurs")).toBe("2 players");
    expect(translateFrench("1 secondes restantes")).toBe("1 second remaining");
    expect(translateFrench("2 secondes restantes")).toBe("2 seconds remaining");
    expect(translateFrench("1 parties enregistrées par Pinkward.")).toBe(
      "1 match recorded by Pinkward.",
    );
  });

  it("maintient un catalogue anglais renseigné", () => {
    expect(Object.keys(englishTranslations).length).toBeGreaterThan(350);
    for (const [source, translation] of Object.entries(englishTranslations)) {
      expect(source.trim(), source).not.toBe("");
      expect(translation.trim(), source).not.toBe("");
    }
  });
});
