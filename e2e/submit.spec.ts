import { test } from "@playwright/test";
import { signIn, addNewPlayer, setPlayerWins, expect } from "./helpers";
import { TEST_SCORER } from "./fixtures";

// Drive the single-grid form (step 16.2 rev): add four on-the-fly new players and
// set each one's wins (but do not submit). `wins` total must be even and > 0.
async function fillFourNewPlayers(
  page: import("@playwright/test").Page,
  token: string,
  wins: [number, number, number, number],
) {
  for (let i = 0; i < 4; i++) {
    const name = `[e2e] ${token} P${i}`;
    await addNewPlayer(page, name, i + 1);
    await setPlayerWins(page, name, wins[i]);
  }
}

test("a scorer submits a valid session and lands on the ladder", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/submit");

  await fillFourNewPlayers(page, `ok-${Date.now()}`, [3, 3, 1, 1]);
  await page.getByRole("button", { name: /log results/i }).click();

  // Redirects to the ladder (home) on success.
  await expect(page).toHaveURL(/\/$/);
});

test("a session with an odd total of wins is rejected", async ({ page }) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/submit");

  await fillFourNewPlayers(page, `odd-${Date.now()}`, [3, 3, 1, 2]);
  await page.getByRole("button", { name: /log results/i }).click();

  await expect(page.getByText(/total wins must be even/i)).toBeVisible();
  await expect(page).toHaveURL(/\/submit/);
});

test("an unauthenticated user cannot reach /submit", async ({ page }) => {
  await page.goto("/submit");
  await expect(page).toHaveURL(/\/signin/);
});
