import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER } from "./fixtures";

// Add a user via the Add User dialog. Names are [e2e]-tagged so teardown removes them.
async function addUser(
  page: import("@playwright/test").Page,
  email: string,
  name: string,
  role: "ADMIN" | "SCORER",
) {
  await page.getByRole("button", { name: "Add User" }).click();
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Name").fill(name);
  await page.getByRole("combobox", { name: "Role" }).selectOption(role);
  await page.getByRole("button", { name: "Add", exact: true }).click();
}

// Each user is a role="group" named by email (the responsive card list, step 13.5
// follow-up — replaced the table rows).
function userRow(page: import("@playwright/test").Page, email: string) {
  return page.getByRole("group", { name: email });
}

test("admin can add scorer and admin users, change role, and delete (b1-4)", async ({
  page,
}) => {
  const token = `users-${Date.now()}`;
  const scorer = `${token}-scorer@bsc.local`;
  const adminUser = `${token}-admin@bsc.local`;

  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  // Behaviour 1: add a Scorer.
  await addUser(page, scorer, `[e2e] ${token} Scorer`, "SCORER");
  const scorerRow = userRow(page, scorer);
  await expect(scorerRow).toBeVisible();
  await expect(scorerRow).toContainText("SCORER");

  // Behaviour 2: add an Admin.
  await addUser(page, adminUser, `[e2e] ${token} Admin`, "ADMIN");
  await expect(userRow(page, adminUser)).toContainText("ADMIN");

  // Behaviour 3: promote the scorer to admin via the Edit dialog (step 16.1).
  await scorerRow.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("combobox", { name: "Role" }).selectOption("ADMIN");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(scorerRow).toContainText("ADMIN");
  await page.reload();
  await expect(userRow(page, scorer)).toContainText("ADMIN");

  // Behaviour 4: delete the (now-admin) user — others remain, so it is allowed.
  await userRow(page, scorer).getByRole("button", { name: "Remove" }).click();
  await expect(userRow(page, scorer)).toHaveCount(0);
});

test("the admin cannot remove their own row (b5)", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/users");
  const selfRow = userRow(page, TEST_ADMIN.email);
  await expect(selfRow.getByRole("button", { name: "Remove" })).toBeDisabled();
});

test("a duplicate email is rejected (b7)", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/users");
  await addUser(page, TEST_ADMIN.email, "[e2e] dup", "SCORER");
  await expect(page.getByText(/already exists/i)).toBeVisible();
});

test("an invalid email is rejected (b8)", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/users");
  await addUser(page, "not-an-email", "[e2e] bad", "SCORER");
  await expect(page.getByText(/valid email is required/i)).toBeVisible();
});

test("a scorer cannot reach the users page (b9)", async ({ page }) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/unauthorised/);
});
