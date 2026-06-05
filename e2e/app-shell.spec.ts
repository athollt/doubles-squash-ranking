import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER } from "./fixtures";

// The global header is in the root layout, so assert against links inside the
// <nav> to avoid matching page-body content.

test("logged-out header shows public links and Sign in, not Sign out", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("link", { name: "Ladder" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Sessions" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Admin" })).toHaveCount(0);
});

test("admin Admin menu links to every admin page", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  const nav = page.getByRole("navigation");
  await expect(nav.getByText(TEST_ADMIN.email)).toBeVisible();
  await expect(nav.getByRole("button", { name: "Sign out" })).toBeVisible();

  // The dropdown is the only navigation to settings/sessions/users.
  await nav.getByRole("button", { name: "Admin" }).click();
  for (const label of ["Players", "Sessions", "Settings", "Users"]) {
    await expect(page.getByRole("menuitem", { name: label })).toBeVisible();
  }
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/admin\/settings/);
});

test("scorer header shows Sign out but no Admin menu", async ({ page }) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Admin" })).toHaveCount(0);
});

test("signing out returns to a logged-out header", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  const nav = page.getByRole("navigation");
  await nav.getByRole("button", { name: "Sign out" }).click();
  await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});
