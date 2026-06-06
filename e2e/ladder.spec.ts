import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_SCORER } from "./fixtures";

// The public ladder (home page) — no auth required to view (behaviour 1).
test("the ladder home page is public and shows the title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "BSC Doubles Squash Ladder" }),
  ).toBeVisible();
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
  await page.goto("/submit");
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("combobox", { name: `Player ${i + 1}` })
      .selectOption("__new__");
    await page
      .getByRole("textbox", { name: `New player name ${i + 1}` })
      .fill(names[i]);
    await page
      .getByRole("spinbutton", { name: `Wins ${i + 1}` })
      .fill(String(wins[i]));
  }
  await page.getByRole("button", { name: "Submit session" }).click();
  await expect(page).toHaveURL(/\/$/);

  // The freshly submitted players are now on the ladder. Each is provisional
  // (one session played) and shows a NEW movement indicator on the desktop view.
  const table = page.locator("table");
  for (const name of names) {
    await expect(table.getByText(name)).toBeVisible();
  }
  // First-time players are provisional and show a NEW movement indicator.
  await expect(
    table.locator("tr", { hasText: names[0] }).getByText("(P)"),
  ).toBeVisible();
  await expect(
    table.locator("tr", { hasText: names[0] }).getByText("NEW"),
  ).toBeVisible();

  // The winner (3 wins) outranks a loser (1 win): higher up the table.
  const rows = table.locator("tbody tr");
  const order = await rows.allInnerTexts();
  const winnerRow = order.findIndex((t) => t.includes(names[0]));
  const loserRow = order.findIndex((t) => t.includes(names[2]));
  expect(winnerRow).toBeGreaterThanOrEqual(0);
  expect(winnerRow).toBeLessThan(loserRow);
});
