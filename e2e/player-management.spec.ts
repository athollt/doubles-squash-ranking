import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN } from "./fixtures";

// All player names carry the [e2e] tag so global-teardown removes them.
function uniqueName(label: string): string {
  return `[e2e] ${label} ${Date.now()}`;
}

test.beforeEach(async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/players");
  await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();
});

test("admin adds a player and it appears in the table", async ({ page }) => {
  const name = uniqueName("Added");
  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible();
});

test("admin renames a player", async ({ page }) => {
  const original = uniqueName("Original");
  const renamed = uniqueName("Renamed");

  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(original);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const row = page.getByRole("row", { name: new RegExp(escapeRegex(original)) });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Edit" }).click();
  const input = page.getByRole("textbox");
  await input.fill(renamed);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("cell", { name: renamed })).toBeVisible();
});

test("admin removes then reactivates a player", async ({ page }) => {
  const name = uniqueName("Status");
  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();

  const row = page.getByRole("row", { name: new RegExp(escapeRegex(name)) });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Remove" }).click();
  await expect(row.getByText("REMOVED")).toBeVisible();

  await row.getByRole("button", { name: "Reactivate" }).click();
  await expect(row.getByText("ACTIVE")).toBeVisible();
});

test("adding a duplicate name (case-insensitive) shows an error", async ({
  page,
}) => {
  const name = uniqueName("Dup");

  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible();

  await page.getByRole("button", { name: "Add Player" }).click();
  await page.getByPlaceholder("Player name").fill(name.toUpperCase());
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(/already exists/i)).toBeVisible();
});

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
