import { expect, test } from "@playwright/test";
import { installAuthenticatedMock } from "./mock-backend";

test("navigation mobile sans chevauchement et changement de langue", async ({
  page,
}) => {
  await installAuthenticatedMock(page);
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "PLUS" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const dialog = page.getByRole("dialog", { name: "Menu mobile" });
  const more = dialog.getByRole("navigation", {
    name: "Navigation supplémentaire",
  });
  await expect(more).toBeVisible();
  await dialog.getByRole("button", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
});

test("le bouton Retour ferme d’abord le menu mobile", async ({ page }) => {
  await installAuthenticatedMock(page);
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "PLUS" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Menu mobile" })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole("dialog", { name: "Menu mobile" })).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expect(trigger).toBeFocused();
});

test("la déconnexion reste accessible dans le menu mobile", async ({
  page,
}) => {
  await installAuthenticatedMock(page);
  await page.goto("/");
  await page.getByRole("button", { name: "PLUS" }).click();
  const dialog = page.getByRole("dialog", { name: "Menu mobile" });
  await expect(
    dialog.getByRole("button", { name: "DÉCONNEXION" }),
  ).toBeVisible();
});
