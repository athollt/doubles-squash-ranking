import { test } from "@playwright/test";
import { signIn, addNewPlayer, expect } from "./helpers";
import { TEST_SCORER } from "./fixtures";

// /sessions is public — reachable without authentication (behaviour 1).
test("the session history page is public", async ({ page }) => {
  await page.goto("/sessions");
  await expect(
    page.getByRole("heading", { name: "Session history" }),
  ).toBeVisible();
});

// A non-existent session id returns 404 (behaviour 5).
test("an unknown session id returns 404", async ({ page }) => {
  const res = await page.goto("/sessions/does-not-exist");
  expect(res?.status()).toBe(404);
});

// A submitted session appears in the list and on its own detail page
// (behaviours 2, 3, 4).
test("a submitted session is listed and has a detail page", async ({
  page,
}) => {
  const token = `hist-${Date.now()}`;
  const names = [0, 1, 2, 3].map((i) => `[e2e] ${token} P${i}`);
  const wins = [3, 2, 2, 1];

  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/submit");
  for (let i = 0; i < 4; i++) {
    await addNewPlayer(page, i + 1, names[i], wins[i]);
  }
  await page.getByRole("button", { name: /log results/i }).click();
  await expect(page).toHaveURL(/\/$/);

  // The session shows on the public list with player count and games.
  await page.goto("/sessions");
  const item = page.locator("details", { hasText: "4 players · 4 games" });
  await expect(item.first()).toBeVisible();

  // Expanding reveals the players, then the detail page shows full detail.
  await item.first().locator("summary").click();
  await expect(item.first().getByText(names[0])).toBeVisible();
  await item.first().getByRole("link", { name: /view full detail/i }).click();

  await expect(page).toHaveURL(/\/sessions\/[^/]+$/);
  await expect(page.getByText(/submitted by/i)).toBeVisible();
  for (const name of names) {
    await expect(page.getByRole("cell", { name })).toBeVisible();
  }
});
