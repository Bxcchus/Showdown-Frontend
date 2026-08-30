import { expect, test } from "@playwright/test";
import { installAuthenticatedMock } from "./mock-backend";

test("les routes de flux orphelines reviennent à Jouer et une route inconnue répond 404", async ({
  page,
}) => {
  await installAuthenticatedMock(page);
  for (const path of ["/searching", "/ready-check", "/lobby"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/play$/);
  }
  const response = await page.goto("/route-qui-nexiste-pas");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "PAGE INTROUVABLE" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "RETOUR À L’ACCUEIL" }),
  ).toBeVisible();
});

test("l’interface anglaise couvre les écrans principaux et les données Riot/saison", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page);
  await page.context().addCookies([
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

  await page.goto("/watcher");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "WATCHER CONTROL CENTER" }),
  ).toBeVisible();
  await expect(page.getByText("WATCHER PROCESS")).toBeVisible();

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "PROFILE" })).toBeVisible();
  await expect(page.getByAltText("Riot profile icon")).toHaveAttribute(
    "src",
    /profileicon%2F29\.png|profileicon\/29\.png/,
  );
  await expect(page.getByText("LEVEL 87")).toBeVisible();

  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: "LEADERBOARD" }),
  ).toBeVisible();
  await expect(page.getByText("PARTIAL RESET:")).toBeVisible();
  await page.locator(".leaderboard-region-select select").selectOption("NA");
  await expect
    .poll(() =>
      state.leaderboardRequests.some((query) => query.includes("region=NA")),
    )
    .toBe(true);

  await page.goto("/history");
  await expect(
    page.getByRole("heading", { name: "MATCH HISTORY" }),
  ).toBeVisible();
});

test("la langue anglaise est présente dans le HTML serveur avant hydratation", async ({
  request,
}) => {
  const response = await request.get("/watcher", {
    headers: {
      Cookie: "pinkward.language=en",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
  });
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toMatch(/<html[^>]*lang="en"/);
  expect(html).toContain("<title>Watcher · Pinkward</title>");
  expect(html).toMatch(/<h1[^>]*>PREPARING YOUR SESSION<\/h1>/);
  expect(html).not.toMatch(/<h1[^>]*>PRÉPARATION DE TA SESSION<\/h1>/);
});

test("les onglets suivent le motif clavier accessible", async ({ page }) => {
  await installAuthenticatedMock(page);
  await page.goto("/history");
  const allMatches = page.getByRole("tab", { name: "TOUTES" });
  await allMatches.focus();
  await allMatches.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "1V1 GLICKO-2" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.goto("/leaderboard");
  const duel = page.getByRole("tab", { name: "1V1 GLICKO-2" });
  await duel.focus();
  await duel.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "5V5 TRUESKILL" }),
  ).toHaveAttribute("aria-selected", "true");
});
