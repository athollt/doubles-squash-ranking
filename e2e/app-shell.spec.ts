import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER } from "./fixtures";

// App shell after the 16.1 polish: primary links (Ladder/Sessions/Submit) live in
// the bottom tab bar (<nav aria-label="Primary">); the top bar (<header> / banner)
// carries identity + account. Signed in, the account control is the avatar
// "Account" button — a menu holding Sign out (step 16.1 follow-up: mobile-app
// pattern, no standalone Sign out button). Admins also get an "Admin menu" hamburger.

test("logged-out shell shows public tabs and Sign in, not the account menu", async ({
  page,
}) => {
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "Primary" });
  await expect(tabs.getByRole("link", { name: /ladder/i })).toBeVisible();
  await expect(tabs.getByRole("link", { name: /sessions/i })).toBeVisible();
  await expect(tabs.getByRole("link", { name: /submit/i })).toHaveCount(0);

  const bar = page.getByRole("banner");
  // Header "Sign in" is now a button (→ Google directly, step 16.1).
  await expect(bar.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Account" })).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Admin menu" })).toHaveCount(0);
});

test("admin Admin menu links to every admin page", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  const bar = page.getByRole("banner");
  await expect(bar.getByRole("button", { name: "Account" })).toBeVisible();

  // The hamburger menu is the only navigation to settings/sessions/users.
  await bar.getByRole("button", { name: "Admin menu" }).click();
  for (const label of ["Players", "Sessions", "Settings", "Users"]) {
    await expect(page.getByRole("menuitem", { name: label })).toBeVisible();
  }
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/admin\/settings/);
});

test("scorer shell shows Submit tab + account menu, but no Admin menu", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: /submit/i,
    }),
  ).toBeVisible();
  const bar = page.getByRole("banner");
  await expect(bar.getByRole("button", { name: "Account" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Admin menu" })).toHaveCount(0);

  // Sign out lives inside the account menu (works for scorers too).
  await bar.getByRole("button", { name: "Account" }).click();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
});

test("signing out from the account menu returns to a logged-out shell", async ({
  page,
}) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  const bar = page.getByRole("banner");
  await bar.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(bar.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Account" })).toHaveCount(0);
});
