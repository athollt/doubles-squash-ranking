import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER } from "./fixtures";

// App shell after the 13.5 redesign: primary links (Ladder/Sessions/Submit) live in
// the bottom tab bar (<nav aria-label="Primary">); identity + account controls
// (Sign in/out, email, Admin menu) live in the top bar (the <header> / banner).

test("logged-out shell shows public tabs and Sign in, not Sign out", async ({
  page,
}) => {
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "Primary" });
  await expect(tabs.getByRole("link", { name: /ladder/i })).toBeVisible();
  await expect(tabs.getByRole("link", { name: /sessions/i })).toBeVisible();
  await expect(tabs.getByRole("link", { name: /submit/i })).toHaveCount(0);

  const bar = page.getByRole("banner");
  await expect(bar.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Admin" })).toHaveCount(0);
});

test("admin Admin menu links to every admin page", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  const bar = page.getByRole("banner");
  await expect(bar.getByText(TEST_ADMIN.email)).toBeVisible();
  await expect(bar.getByRole("button", { name: "Sign out" })).toBeVisible();

  // The dropdown is the only navigation to settings/sessions/users.
  await bar.getByRole("button", { name: "Admin" }).click();
  for (const label of ["Players", "Sessions", "Settings", "Users"]) {
    await expect(page.getByRole("menuitem", { name: label })).toBeVisible();
  }
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/admin\/settings/);
});

test("scorer shell shows Submit tab + Sign out, but no Admin menu", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: /submit/i,
    }),
  ).toBeVisible();
  const bar = page.getByRole("banner");
  await expect(bar.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Admin" })).toHaveCount(0);
});

test("signing out returns to a logged-out shell", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  const bar = page.getByRole("banner");
  await bar.getByRole("button", { name: "Sign out" }).click();
  await expect(bar.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});
