import { expect, test } from "@playwright/test";
import { installAuthenticatedMock } from "./mock-backend";

test("Partie rapide lance le préréglage 5v5 réellement affiché", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page);
  await page.goto("/");
  await expect(page.getByLabel("Mode de partie rapide")).toHaveValue("5V5");
  await page.getByRole("button", { name: "JOUER MAINTENANT" }).click();

  await expect(page).toHaveURL(/\/searching$/);
  expect(state.queueRequest).toMatchObject({
    mode: "FIVE_V_FIVE",
    primaryRole: "MID",
    secondaryRole: "JUNGLE",
  });
});

test("parcours 1v1 : recherche, ready-check et lobby vérifié", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page);
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: "HOWLING ABYSS" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "TROUVER UN MATCH" }).click();
  await expect(page).toHaveURL(/\/searching$/);

  state.phase = "ready";
  await page.reload();
  await expect(page).toHaveURL(/\/ready-check$/);
  await page.getByRole("button", { name: "ACCEPTER" }).click();
  await expect(page).toHaveURL(/\/lobby$/);
  await expect(page.getByText("SWD-E2E")).toBeVisible();
  await expect(page.getByText("TEST1234")).toBeVisible();
  await expect(page.getByRole("button", { name: "VICTOIRE" })).toHaveCount(0);
  await expect(
    page.getByText(/résultat est envoyé automatiquement/i),
  ).toBeVisible();
  state.watcherOutcome = "VICTORY";
  await page.waitForTimeout(1_800);
  expect(state.botResultRequests).toBe(0);
});

test("parcours 5v5 : le rôle principal est transmis en priorité", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page);
  await page.goto("/play");
  await page
    .locator(".central-mode-picker button")
    .filter({ hasText: "5V5" })
    .click();
  await expect(
    page.getByRole("heading", { name: "SUMMONER'S RIFT" }),
  ).toBeVisible();
  const roleGroups = page.locator("fieldset");
  await roleGroups.nth(0).getByRole("radio", { name: "JUNGLE" }).click();
  await roleGroups.nth(1).getByRole("radio", { name: "MID" }).click();
  await page.getByRole("button", { name: "TROUVER UN MATCH" }).click();
  await expect(page).toHaveURL(/\/searching$/);
  expect(state.queueRequest).toMatchObject({
    mode: "FIVE_V_FIVE",
    primaryRole: "JUNGLE",
    secondaryRole: "MID",
  });

  state.phase = "ready";
  await page.reload();
  await expect(page).toHaveURL(/\/ready-check$/);
  await page.getByRole("button", { name: "ACCEPTER" }).click();
  await expect(page).toHaveURL(/\/lobby$/);
  await expect.poll(() => state.teamWatcherStarts).toBe(1);
  await expect(
    page.getByText(/vérifie les joueurs, suit le lancement/i),
  ).toBeVisible();

  state.phase = "idle";
  state.watcherState = "CANCELLED";
  await expect(page).toHaveURL(/\/play$/, { timeout: 5_000 });
  await expect(
    page.getByRole("heading", { name: "SUMMONER'S RIFT" }),
  ).toBeVisible();
});
