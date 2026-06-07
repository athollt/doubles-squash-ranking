import { test } from "@playwright/test";
import { signIn, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER } from "./fixtures";

test("admin can view all settings with their values", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  // The rating-algorithm explainer is shown above the settings (step 16.3).
  await expect(
    page.getByRole("heading", { name: /how ratings work/i }),
  ).toBeVisible();
  // A known seeded setting is present and editable.
  await expect(page.getByRole("spinbutton", { name: "KFactor" })).toBeVisible();
});

test("admin can edit a setting and save & recalculate", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/settings");

  const kfactor = page.getByRole("spinbutton", { name: "KFactor" });
  const original = await kfactor.inputValue();
  try {
    await kfactor.fill("170");
    await page.getByRole("button", { name: "Save & Recalculate" }).click();

    await expect(page.getByText(/saved and recalculated/i)).toBeVisible();
    // Value persists after the server round-trip.
    await page.reload();
    await expect(
      page.getByRole("spinbutton", { name: "KFactor" }),
    ).toHaveValue("170");
  } finally {
    // Restore the seeded value so reruns and manual testing stay clean.
    await page.getByRole("spinbutton", { name: "KFactor" }).fill(original);
    await page.getByRole("button", { name: "Save & Recalculate" }).click();
    await expect(page.getByText(/saved and recalculated/i)).toBeVisible();
  }
});

test("a scorer cannot reach the settings page", async ({ page }) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/unauthorised/);
});
