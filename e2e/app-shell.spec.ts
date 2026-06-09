import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER } from "./fixtures";

// App shell: primary links (Ladder/Sessions/Submit) live in the bottom tab bar
// (<nav aria-label="Primary">); the top bar (<header> / banner) carries identity +
// account. Signed in, the account control is the avatar "Account" button — a menu
// holding Sign out. Any signed-in user also gets a "Menu" hamburger of management
// pages: scorers see Players/Sessions/Settings; admins also see Users (step 16.x).

test("logged-out shell shows public tabs and Sign in, not the account menu", async ({
  page,
}) => {
  await page.goto("/l/bsc-doubles-squash");
  // The header carries the Rungs wordmark (step 24 rebrand).
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Rungs" }),
  ).toBeVisible();
  const tabs = page.getByRole("navigation", { name: "Primary" });
  await expect(tabs.getByRole("link", { name: /ladder/i })).toBeVisible();
  await expect(tabs.getByRole("link", { name: /sessions/i })).toBeVisible();
  await expect(tabs.getByRole("link", { name: /submit/i })).toHaveCount(0);

  const bar = page.getByRole("banner");
  // Header "Sign in" is now a button (→ Google directly, step 16.1).
  await expect(bar.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Account" })).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Menu" })).toHaveCount(0);
});

test("admin menu links to every management page incl. Users", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  // The per-league management links resolve against the current league, so view
  // a league page; admins also get the global Leagues + Users links.
  await page.goto("/l/bsc-doubles-squash");
  const bar = page.getByRole("banner");
  await expect(bar.getByRole("button", { name: "Account" })).toBeVisible();

  await bar.getByRole("button", { name: "Menu" }).click();
  for (const label of ["Players", "Sessions", "Ratings", "Leagues", "Users"]) {
    await expect(page.getByRole("menuitem", { name: label })).toBeVisible();
  }
  await page.getByRole("menuitem", { name: "Ratings" }).click();
  await expect(page).toHaveURL(/\/admin\/settings/);
});

test("scorer menu shows Players/Sessions/Ratings but not Users", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/l/bsc-doubles-squash");
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: /submit/i,
    }),
  ).toBeVisible();
  const bar = page.getByRole("banner");
  await expect(bar.getByRole("button", { name: "Account" })).toBeVisible();

  // The scorer has the Menu, with Players/Sessions/Ratings but no Users.
  await bar.getByRole("button", { name: "Menu" }).click();
  for (const label of ["Players", "Sessions", "Ratings"]) {
    await expect(page.getByRole("menuitem", { name: label })).toBeVisible();
  }
  await expect(page.getByRole("menuitem", { name: "Users" })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: "Leagues" })).toHaveCount(0);

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
