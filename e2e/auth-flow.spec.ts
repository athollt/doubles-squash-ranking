import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER, NON_ALLOWLISTED } from "./fixtures";

// Step 04 behaviour 8 — an account not in the users table is denied. Via the
// credentials provider, authorize() returns null, so the form shows an error
// and the user never reaches a protected page.
test("a non-allowlisted account is denied at sign-in", async ({ page }) => {
  await signIn(page, NON_ALLOWLISTED.email, NON_ALLOWLISTED.password, {
    expectError: true,
  });
  await expect(page).toHaveURL(/\/signin/);
});

// A scorer is authenticated but lacks admin role — Users stays ADMIN-only
// (step 16.x: Players/Sessions/Settings opened to scorers, Users did not).
test("a scorer is redirected to /unauthorised from the Users admin screen", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/unauthorised/);
});

// A scorer may now reach the Players admin screen and edit it (step 16.x).
test("a scorer can reach and add a player on the players admin screen", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/l/bsc-doubles-squash/admin/players");
  await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();

  const name = `[e2e] scorer-add ${Date.now()}`;
  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("group", { name })).toBeVisible();
});

// An admin reaches the admin players page.
test("an admin can reach the players admin page", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/l/bsc-doubles-squash/admin/players");
  await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();
});
