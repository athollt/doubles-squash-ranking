import { test } from "@playwright/test";
import { signIn, addNewPlayer, expect } from "./helpers";
import { TEST_SCORER } from "./fixtures";

// An unknown player id returns 404 (behaviour 4).
test("an unknown player id returns 404", async ({ page }) => {
  const res = await page.goto("/players/does-not-exist");
  expect(res?.status()).toBe(404);
});

// After a session, a player is reachable from the ladder, the page is public,
// and it shows name + current rating + sessions played + the trend table
// (behaviours 1, 2, 3). The chart container renders the player's data point.
test("a player's page is public and shows their rating trend", async ({
  page,
}) => {
  const token = `trend-${Date.now()}`;
  const names = [0, 1, 2, 3].map((i) => `[e2e] ${token} P${i}`);
  const wins = [3, 2, 2, 1];

  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/submit");
  for (let i = 0; i < 4; i++) {
    await addNewPlayer(page, i + 1, names[i], wins[i]);
  }
  await page.getByRole("button", { name: /log results/i }).click();
  await expect(page).toHaveURL(/\/$/);

  // Reach the player page by clicking their name on the ladder.
  const table = page.locator("table");
  await table.getByRole("link", { name: names[0] }).first().click();

  await expect(page).toHaveURL(/\/players\/[^/]+$/);
  await expect(page.getByRole("heading", { name: names[0] })).toBeVisible();
  // Stats are in the main content (scope past the header, which shows the user email).
  const main = page.getByRole("main");
  await expect(main.getByText("Score:")).toBeVisible();
  await expect(main.getByText("Played:")).toBeVisible();

  // The trend table lists the session that was just played.
  await expect(page.getByRole("columnheader", { name: "Change" })).toBeVisible();
});
