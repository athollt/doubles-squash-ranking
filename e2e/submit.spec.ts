import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_SCORER } from "./fixtures";

// Fill the four default slots as on-the-fly new players (also exercises
// behaviour 8). `wins` are passed per slot; total must be even and > 0.
async function fillFourNewPlayers(
  page: import("@playwright/test").Page,
  token: string,
  wins: [number, number, number, number],
) {
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("combobox", { name: `Player ${i + 1}` })
      .selectOption("__new__");
    await page
      .getByRole("textbox", { name: `New player name ${i + 1}` })
      .fill(`[e2e] ${token} P${i}`);
    await page.getByRole("spinbutton", { name: `Wins ${i + 1}` }).fill(
      String(wins[i]),
    );
  }
}

test("a scorer submits a valid session and lands on the ladder", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/submit");

  await fillFourNewPlayers(page, `ok-${Date.now()}`, [3, 3, 1, 1]);
  await page.getByRole("button", { name: "Submit session" }).click();

  // Redirects to the ladder (home) on success.
  await expect(page).toHaveURL(/\/$/);
});

test("a session with an odd total of wins is rejected", async ({ page }) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/submit");

  await fillFourNewPlayers(page, `odd-${Date.now()}`, [3, 3, 1, 2]);
  await page.getByRole("button", { name: "Submit session" }).click();

  await expect(page.getByText(/total wins must be even/i)).toBeVisible();
  await expect(page).toHaveURL(/\/submit/);
});

test("an unauthenticated user cannot reach /submit", async ({ page }) => {
  await page.goto("/submit");
  await expect(page).toHaveURL(/\/signin/);
});
