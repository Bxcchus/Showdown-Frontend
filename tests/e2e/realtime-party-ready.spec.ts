import { expect, test } from "@playwright/test";
import { installAuthenticatedMock } from "./mock-backend";

test("un ready-check accepté reste verrouillé pendant l’attente", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page, {
    phase: "ready",
    autoLobbyOnAccept: false,
  });
  await page.goto("/ready-check");
  await page.getByRole("button", { name: "ACCEPTER" }).click();
  await expect(page.getByText("TU AS ACCEPTÉ")).toBeVisible();
  await expect(page.getByRole("button", { name: "ACCEPTER" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "REFUSER" })).toHaveCount(0);
  expect(state.readyAccepted).toBe(true);
  await expect(page).toHaveURL(/\/ready-check$/);
});

test("création du groupe, invitation et statut prêt", async ({ page }) => {
  const state = await installAuthenticatedMock(page);
  await page.goto("/play");
  await page.getByRole("button", { name: "CRÉER UN GROUPE" }).click();
  await expect(page.getByText("CHEF")).toBeVisible();
  await page.getByLabel("Pseudo du joueur").fill("local-player2");
  await page.getByRole("button", { name: "INVITER" }).click();
  await expect(page.getByText("INVITATIONS EN ATTENTE")).toBeVisible();
  await expect(page.getByText("local-player2")).toBeVisible();
  await page.getByRole("button", { name: "PRÊT", exact: true }).click();
  expect(state.party?.members[0].ready).toBe(true);
});

test("le temps réel se reconnecte sans mettre le JWT dans l’URL", async ({
  page,
}) => {
  const state = await installAuthenticatedMock(page);
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-realtime-status",
    "connected",
  );
  expect(state.webSocketUrls).toHaveLength(2);
  expect(state.webSocketUrls.every((url) => !url.includes("bearer."))).toBe(
    true,
  );
  expect(
    state.webSocketProtocols.every((protocols) =>
      protocols.some((protocol) => protocol.startsWith("bearer.")),
    ),
  ).toBe(true);

  await state.webSockets[0].close({ code: 1012, reason: "test" });
  await expect(page.getByText(/Reconnexion en cours/i)).toBeVisible();
  await page.getByRole("button", { name: "RÉESSAYER" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-realtime-status",
    "connected",
  );
  expect(state.webSockets.length).toBeGreaterThanOrEqual(4);
});
