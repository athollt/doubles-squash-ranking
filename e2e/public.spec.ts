import { test, expect } from "@playwright/test";

// Public pages (steps 01, 03 surface) — no auth required.
test("ladder home page is public and renders the title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Doubles Squash @ BSC" }),
  ).toBeVisible();
});

test("unauthorised page is public and shows the no-access message", async ({
  page,
}) => {
  await page.goto("/unauthorised");
  await expect(page.getByText(/does not have access/i)).toBeVisible();
});
