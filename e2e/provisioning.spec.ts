import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER, LEAGUE_SLUG } from "./fixtures";

// Step 22 — landing, switcher & admin provisioning.

test("the landing page lists leagues and links to /l/{slug}", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Rungs" })).toBeVisible();
  // The seed BSC league is browsable from the landing list.
  const link = page.getByRole("link", { name: /Doubles Squash @ BSC/i });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", `/l/${LEAGUE_SLUG}`);
});

test("an admin creates a league, then adds and removes a scorer inside Edit", async ({
  page,
}) => {
  const token = `${Date.now()}`;
  const slug = `e2e-prov-${token}`;
  const display = `[e2e] Provisioned ${token}`;
  const scorerLabel = `${TEST_SCORER.name} (${TEST_SCORER.email})`;

  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/leagues");

  // Create via the Add League dialog. Display name auto-fills from the name;
  // override the suggested slug to our token.
  await page.getByRole("button", { name: "Add League" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "League name" }).fill(display);
  await dialog.getByRole("textbox", { name: "Slug" }).fill(slug);
  await dialog.getByRole("button", { name: "Create" }).click();

  // The new league appears in the list and its public ladder is reachable.
  await expect(page.getByRole("group", { name: display })).toBeVisible();
  await expect(async () => {
    const res = await page.goto(`/l/${slug}`);
    expect(res?.status()).toBe(200);
  }).toPass();

  // Assign the existing fixture scorer from inside the league's Edit dialog.
  await page.goto("/admin/leagues");
  await page.getByRole("group", { name: display }).getByRole("button", { name: "Edit" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Add scorer").selectOption({ label: scorerLabel });
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  // The scorer now appears in the dialog's scorer list with a Remove button.
  const scorerRow = dialog.getByRole("listitem").filter({ hasText: TEST_SCORER.email });
  await expect(scorerRow).toBeVisible();

  // The newly-granted league now shows for that scorer on the landing page.
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/");
  await expect(page.getByRole("link", { name: display })).toBeVisible();

  // Back as admin: remove the scorer from the league in Edit.
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/leagues");
  await page.getByRole("group", { name: display }).getByRole("button", { name: "Edit" }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByRole("listitem")
    .filter({ hasText: TEST_SCORER.email })
    .getByRole("button", { name: "Remove" })
    .click();
  await expect(
    dialog.getByRole("listitem").filter({ hasText: TEST_SCORER.email }),
  ).toHaveCount(0);
});

test("an admin can edit a league's display name (slug stays put)", async ({
  page,
}) => {
  const token = `${Date.now()}`;
  const slug = `e2e-edit-${token}`;
  const display = `[e2e] Editable ${token}`;
  const renamed = `[e2e] Renamed ${token}`;

  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/leagues");
  await page.getByRole("button", { name: "Add League" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "League name" }).fill(display);
  await dialog.getByRole("textbox", { name: "Slug" }).fill(slug);
  await dialog.getByRole("button", { name: "Create" }).click();

  // Edit it via the per-row Edit dialog (Users pattern).
  const row = page.getByRole("group", { name: display });
  await row.getByRole("button", { name: "Edit" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Display name" }).fill(renamed);
  await dialog.getByRole("button", { name: "Save" }).click();

  // The row now shows the new display name; the slug (URL) is unchanged.
  await expect(page.getByRole("group", { name: renamed })).toBeVisible();
  const res = await page.goto(`/l/${slug}`);
  expect(res?.status()).toBe(200);
});

test("an admin can click through a league row to its ladder", async ({
  page,
}) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/leagues");
  // The BSC row's name links to its ladder (like the landing list).
  await page
    .getByRole("group", { name: "Doubles Squash @ BSC" })
    .getByRole("link")
    .click();
  await expect(page).toHaveURL(/\/l\/bsc-doubles-squash$/);
  await expect(page.getByRole("heading", { name: "Ladder" })).toBeVisible();
});

test("an admin deletes a league after confirming the impact", async ({
  page,
}) => {
  const token = `${Date.now()}`;
  const slug = `e2e-del-${token}`;
  const display = `[e2e] Deletable ${token}`;

  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/leagues");
  await page.getByRole("button", { name: "Add League" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "League name" }).fill(display);
  await dialog.getByRole("textbox", { name: "Slug" }).fill(slug);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("group", { name: display })).toBeVisible();

  // Delete it via the confirmation modal.
  await page
    .getByRole("group", { name: display })
    .getByRole("button", { name: "Delete" })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/permanently deletes/i)).toBeVisible();
  await dialog.getByRole("button", { name: "Delete league" }).click();

  // The row is gone and the ladder 404s (retry the navigation to ride out
  // revalidation timing).
  await expect(page.getByRole("group", { name: display })).toHaveCount(0);
  await expect(async () => {
    const res = await page.goto(`/l/${slug}`);
    expect(res?.status()).toBe(404);
  }).toPass();
});

test("a granted scorer sees only their leagues on the landing page", async ({
  page,
}) => {
  // The fixture test scorer is granted only the BSC league (global setup).
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Doubles Squash @ BSC/i }),
  ).toBeVisible();
  // They are not granted the ephemeral OTHER_LEAGUE, so it must not appear.
  await expect(
    page.getByRole("link", { name: /Other League/i }),
  ).toHaveCount(0);
});
