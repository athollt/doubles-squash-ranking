import { test } from "@playwright/test";
import { signIn, addNewPlayer, setSlotWins, expect } from "./helpers";
import { TEST_ADMIN, TEST_SCORER } from "./fixtures";
import type { Page } from "@playwright/test";

// Submit a session of four on-the-fly [e2e] players as the signed-in user.
async function submitSession(page: Page, token: string) {
  await page.goto("/submit");
  const wins = [3, 3, 1, 1];
  for (let i = 0; i < 4; i++) {
    await addNewPlayer(page, i + 1, `[e2e] ${token} P${i}`, wins[i]);
  }
  await page.getByRole("button", { name: /log tonight/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

// Find the newest session's edit URL from the admin sessions list.
async function newestEditHref(page: Page): Promise<string> {
  await page.goto("/admin/sessions");
  const firstEdit = page.getByRole("link", { name: "Edit" }).first();
  await expect(firstEdit).toBeVisible();
  return (await firstEdit.getAttribute("href")) ?? "";
}

test("a scorer can edit their own session", async ({ page }) => {
  const token = `own-edit-${Date.now()}`;
  // Scorer submits a session (owned by the scorer).
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await submitSession(page, token);

  // There is no public session list yet (step 10), so discover the edit URL via
  // the admin list, then act as the scorer — whose ownership check passes.
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  const href = await newestEditHref(page);

  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto(href);
  await expect(page.getByRole("heading", { name: "Edit session" })).toBeVisible();
  await setSlotWins(page, 1, 5);
  await setSlotWins(page, 3, 3);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("a scorer is redirected from another user's session edit page", async ({
  page,
}) => {
  // Admin submits a session (owned by admin).
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await submitSession(page, `admin-owned-${Date.now()}`);
  const href = await newestEditHref(page);

  // Now sign in as the scorer and try to open the admin's session edit page.
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto(href);
  await expect(page).toHaveURL(/\/unauthorised/);
});

test("an admin can edit any session and save", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await submitSession(page, `admin-edit-${Date.now()}`);
  const href = await newestEditHref(page);

  await page.goto(href);
  await expect(page.getByRole("heading", { name: "Edit session" })).toBeVisible();
  // Change a win value (keep total even) and save.
  await setSlotWins(page, 1, 5);
  await setSlotWins(page, 3, 3);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("an admin can delete a session", async ({ page }) => {
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await submitSession(page, `admin-del-${Date.now()}`);
  const href = await newestEditHref(page);

  await page.goto(href);
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/$/);
});
