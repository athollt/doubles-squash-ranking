import { test } from "@playwright/test";
import { signIn, submitNewSession, expect } from "./helpers";
import { TEST_SCORER } from "./fixtures";

// The public ladder (home page) — no auth required to view (behaviour 1).
test("the ladder home page is public and shows the title", async ({ page }) => {
  await page.goto("/l/bsc-doubles-squash");
  await expect(page.getByRole("heading", { name: "Ladder" })).toBeVisible();
});

// After a session is submitted, the players appear on the ladder ranked, and a
// first-time player is shown as provisional (behaviours 2, 3, 6, 7).
test("submitted players appear on the ladder, ranked and provisional", async ({
  page,
}) => {
  const token = `ladder-${Date.now()}`;
  const names = [0, 1, 2, 3].map((i) => `[e2e] ${token} P${i}`);
  const wins = [3, 3, 1, 1];

  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/l/bsc-doubles-squash/submit");
  await submitNewSession(page, names, wins);
  await expect(page).toHaveURL(/\/l\/bsc-doubles-squash$/);

  // The freshly submitted players are now on the ladder. Each is provisional
  // (one session played) and shows a New badge + a NEW trend indicator.
  const table = page.locator("table");
  for (const name of names) {
    await expect(table.getByText(name)).toBeVisible();
  }
  // Each player name is a link to their trend (the tap affordance, step 16.4 rev).
  await expect(table.getByRole("link", { name: names[0] })).toBeVisible();
  // First-time players are provisional ("New" badge) and show a NEW trend.
  await expect(
    table.locator("tr", { hasText: names[0] }).getByText("New", { exact: true }),
  ).toBeVisible();
  await expect(
    table.locator("tr", { hasText: names[0] }).getByText("NEW", { exact: true }),
  ).toBeVisible();

  // The winner (3 wins) outranks a loser (1 win): higher up the table.
  const rows = table.locator("tbody tr");
  const order = await rows.allInnerTexts();
  const winnerRow = order.findIndex((t) => t.includes(names[0]));
  const loserRow = order.findIndex((t) => t.includes(names[2]));
  expect(winnerRow).toBeGreaterThanOrEqual(0);
  expect(winnerRow).toBeLessThan(loserRow);
});
