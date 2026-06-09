import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN } from "./fixtures";

// All player names carry the [e2e] tag so global-teardown removes them.
function uniqueName(label: string): string {
  return `[e2e] ${label} ${Date.now()}`;
}

// Each player is a role="group" named by name (the card list — step 16.1,
// mirroring Admin → Users).
function playerCard(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("group", { name });
}

test.beforeEach(async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/l/bsc-doubles-squash/admin/players");
  await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();
});

test("admin adds a player and it appears in the list", async ({ page }) => {
  const name = uniqueName("Added");
  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(playerCard(page, name)).toBeVisible();
});

test("admin renames a player", async ({ page }) => {
  const original = uniqueName("Original");
  const renamed = uniqueName("Renamed");

  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(original);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const card = playerCard(page, original);
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: "Edit" }).click();
  const input = page.getByRole("textbox");
  await input.fill(renamed);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(playerCard(page, renamed)).toBeVisible();
});

test("admin removes then reactivates a player", async ({ page }) => {
  const name = uniqueName("Status");
  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();

  const card = playerCard(page, name);
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: "Deactivate" }).click();
  await expect(card.getByText("REMOVED")).toBeVisible();

  await card.getByRole("button", { name: "Reactivate" }).click();
  await expect(card.getByText("ACTIVE")).toBeVisible();
});

test("adding a duplicate name (case-insensitive) shows an error", async ({
  page,
}) => {
  const name = uniqueName("Dup");

  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(playerCard(page, name)).toBeVisible();

  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name.toUpperCase());
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(/already exists/i)).toBeVisible();
});
