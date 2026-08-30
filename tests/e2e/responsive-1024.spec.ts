import { expect, test } from "@playwright/test";
import { installAuthenticatedMock } from "./mock-backend";

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page,
) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    offenders: [
      ...document.querySelectorAll<HTMLElement>(
        "main button, main a, main input, main select",
      ),
    ]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
        );
      })
      .map((element) => element.textContent?.trim() || element.ariaLabel),
  }));
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.offenders).toEqual([]);
}

test("le site reste contenu et actionnable à 1024 px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const state = await installAuthenticatedMock(page);

  for (const path of [
    "/",
    "/play",
    "/watcher",
    "/history",
    "/leaderboard",
    "/profile",
  ]) {
    await page.goto(path);
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "data-session-status",
      "authenticated",
    );
    await expectNoHorizontalOverflow(page);
  }

  state.phase = "ready";
  await page.goto("/ready-check");
  await expect(page).toHaveURL(/\/ready-check$/);
  await expectNoHorizontalOverflow(page);

  state.phase = "lobby";
  await page.goto("/lobby");
  await expect(page).toHaveURL(/\/lobby$/);
  await expectNoHorizontalOverflow(page);
});
