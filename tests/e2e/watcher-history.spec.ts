import { expect, test } from "@playwright/test";
import { installAuthenticatedMock, matchId } from "./mock-backend";

test("Watcher : état local, identité Riot et liaison du profil", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page);
  await page.goto("/watcher");
  await expect(page.getByText("Claude Code#JAVA").first()).toBeVisible();
  await expect(page.getByText("CONNECTÉ").first()).toBeVisible();
  await page.getByRole("button", { name: "ACTUALISER LE RIOT ID" }).click();
  await expect
    .poll(() => state.riotLinkRequest)
    .toMatchObject({
      challengeId: "44444444-4444-4444-8444-444444444444",
      puuid: "verified-puuid-1234567890",
      gameName: "Claude Code",
      tagLine: "JAVA",
    });
});

test("Historique : filtres serveur, détail et restauration par URL", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page);
  await page.goto("/history?mode=1v1&region=euw&role=mid&outcome=victory");
  await expect(page.getByText("Duel classé · Glicko-2")).toBeVisible();
  await expect
    .poll(() =>
      state.historyRequests.some(
        (query) =>
          query.includes("mode=ONE_V_ONE") &&
          query.includes("region=EUW") &&
          query.includes("role=MID") &&
          query.includes("outcome=VICTORY"),
      ),
    )
    .toBe(true);
  await page.locator(".history-entry-main").click();
  await expect(page).toHaveURL(new RegExp(`match=${matchId}`));
  await expect(
    page.getByRole("heading", { name: "ADVERSAIRES" }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(new RegExp(`match=${matchId}`));
  await expect(page.getByRole("heading", { name: "ADVERSAIRES" })).toHaveCount(
    0,
  );
  await expect(page).toHaveURL(/mode=1v1/);

  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`match=${matchId}`));
  await expect(
    page.getByRole("heading", { name: "ADVERSAIRES" }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "ADVERSAIRES" }),
  ).toBeVisible();
});
