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

test("an admin creates a league (Add dialog) and assigns an existing scorer to it", async ({
  page,
}) => {
  const token = `${Date.now()}`;
  const slug = `e2e-prov-${token}`;
  const display = `[e2e] Provisioned ${token}`;

  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/leagues");

  // Create via the Add League dialog (Users-pattern). Display name auto-fills
  // from the name; override the suggested slug to our token.
  await page.getByRole("button", { name: "Add League" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "League name" }).fill(display);
  await dialog.getByRole("textbox", { name: "Slug" }).fill(slug);
  await dialog.getByRole("button", { name: "Create" }).click();

  // The new league appears in the list and its public ladder is reachable.
  await expect(page.getByRole("group", { name: display })).toBeVisible();
  await expect(async () => {
    const res = await page.goto(`/l/${slug}`);
    expect(res?.status()).toBe(200);
  }).toPass();

  // Assign the existing fixture scorer to the new league via the dropdowns.
  await page.goto("/admin/leagues");
  await page
    .getByLabel("Scorer", { exact: true })
    .selectOption({ label: `${TEST_SCORER.name} (${TEST_SCORER.email})` });
  await page.getByLabel("League", { exact: true }).selectOption({ label: display });
  await page.getByRole("button", { name: "Assign scorer" }).click();
  await expect(page.getByText(/scorer assigned/i)).toBeVisible();

  // The newly-granted league now shows for that scorer on the landing page.
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/");
  await expect(page.getByRole("link", { name: display })).toBeVisible();
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
