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

// Step 04 — a scorer is authenticated but lacks admin role.
test("a scorer is redirected to /unauthorised from an admin route", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/admin/players");
  await expect(page).toHaveURL(/\/unauthorised/);
});

// Step 04/05 — an admin reaches the admin players page.
test("an admin can reach the players admin page", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/players");
  await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();
});
