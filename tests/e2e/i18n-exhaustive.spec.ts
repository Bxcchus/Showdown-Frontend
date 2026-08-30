import { expect, test, type Page } from "@playwright/test";
import { installAuthenticatedMock, type MockState } from "./mock-backend";

const frenchText =
  /[àâçéèêëîïôùûüÿœæ]|\b(?:accueil|jouer|historique|classement|profil|paramètres?|télécharger|connexion|déconnexion|connecter|langue|groupe|prêt|prête|prêts|joueur|joueurs|équipe|recherche|chercher|trouver|annuler|accepter|refuser|refusé|victoire|défaite|rôle|principal|secondaire|aucun|aucune|tous|toutes|précédent|suivant|retour|attente|tourelle|sang|sbires|surveillé|saison|bilan|actuel|avant|après|partie|parties|chargé|chargés|enregistré|enregistrées|enregistrement|depuis|lier|quitter|inviter|envoyée|réessayer|délai|expiré|confirmé|restante|restantes|conservés|perte|état|pseudo|objectif|ouvrir|lancer|actualiser|vérifier|envoi|plateforme|communautaire|formez|choisissez|votre|prochain|rejoindre|hors ligne|en ligne)\b/iu;

async function expectEnglishOnly(page: Page, scenario: string) {
  await expect(page.locator("html"), scenario).toHaveAttribute("lang", "en");

  const samples = await page.evaluate(() => {
    const values: Array<{ source: string; value: string }> = [
      { source: "document.title", value: document.title },
    ];
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
    ]) {
      const value = document.querySelector(selector)?.getAttribute("content");
      if (value) values.push({ source: selector, value });
    }
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName))
        continue;
      const value = node.data.replace(/\s+/g, " ").trim();
      if (value) values.push({ source: parent.tagName.toLowerCase(), value });
    }
    for (const element of document.querySelectorAll("*")) {
      for (const attribute of [
        "aria-label",
        "aria-description",
        "placeholder",
        "title",
        "alt",
      ]) {
        const value = element
          .getAttribute(attribute)
          ?.replace(/\s+/g, " ")
          .trim();
        if (value) values.push({ source: attribute, value });
      }
    }
    return values;
  });

  const offenders = samples.filter(
    ({ value }) =>
      frenchText.test(value) ||
      /^(?:V|D)$/.test(value) ||
      /\b\d+\s+V\s+—\s+\d+\s+D\b/.test(value),
  );
  expect(offenders, `${scenario}: French text is still present`).toEqual([]);
}

async function waitForSession(
  page: Page,
  status: "authenticated" | "anonymous",
) {
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-session-status",
    status,
  );
}

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: "pinkward.language",
      value: "en",
      url: "http://127.0.0.1:3100",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.addInitScript(() =>
    localStorage.setItem("pinkward.language", "fr"),
  );
});

test("the complete authenticated interface is available in English", async ({
  page,
}) => {
  await installAuthenticatedMock(page);

  for (const path of [
    "/",
    "/play",
    "/watcher",
    "/history",
    "/leaderboard",
    "/profile",
    "/download",
    "/settings",
  ]) {
    await page.goto(path);
    await waitForSession(page, "authenticated");
    await expectEnglishOnly(page, `authenticated ${path}`);

    if (path === "/play") {
      await page
        .locator(".central-mode-picker button")
        .filter({ hasText: "5V5" })
        .click();
      await expectEnglishOnly(page, "authenticated /play 5v5");

      await page.getByRole("button", { name: "CREATE PARTY" }).click();
      await expect(page.getByText("Party created.")).toBeVisible();
      await expectEnglishOnly(page, "authenticated /play party");
    }

    if (path === "/history") {
      await page.locator(".history-entry-main").first().click();
      await expect(page.locator(".history-detail")).toBeVisible();
      await expectEnglishOnly(page, "authenticated /history detail");
    }

    if (path === "/leaderboard") {
      await page.getByRole("tab", { name: "5V5 TRUESKILL" }).click();
      await expectEnglishOnly(page, "authenticated /leaderboard 5v5");
    }
  }
});

for (const scenario of [
  {
    phase: "queue" as const,
    path: "/searching",
    heading: "SEARCHING FOR A MATCH",
  },
  { phase: "ready" as const, path: "/ready-check", heading: "READY CHECK" },
  { phase: "lobby" as const, path: "/lobby", heading: "MATCH LOBBY" },
]) {
  test(`${scenario.phase} flow is fully translated`, async ({ page }) => {
    await installAuthenticatedMock(page, {
      phase: scenario.phase as MockState["phase"],
    });
    await page.goto(scenario.path);
    await waitForSession(page, "authenticated");
    await expect(
      page.getByRole("heading", { name: scenario.heading }),
    ).toBeVisible();
    await expectEnglishOnly(page, `${scenario.phase} flow`);
  });
}

test("anonymous and not-found states are fully translated", async ({
  page,
}) => {
  await installAuthenticatedMock(page, { authenticated: false });

  for (const path of [
    "/",
    "/play",
    "/watcher",
    "/history",
    "/leaderboard",
    "/profile",
    "/download",
    "/settings",
  ]) {
    await page.goto(path);
    await waitForSession(page, "anonymous");
    await expectEnglishOnly(page, `anonymous ${path}`);
  }

  const response = await page.goto("/unknown/translation-check");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "PAGE NOT FOUND" }),
  ).toBeVisible();
  await expectEnglishOnly(page, "not found");
});
