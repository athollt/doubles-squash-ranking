import { test, expect } from "@playwright/test";

// Step 04 middleware: unauthenticated access to protected routes redirects to
// the sign-in page.
test("unauthenticated visit to /admin/players redirects to sign-in", async ({
  page,
}) => {
  await page.goto("/admin/players");
  await expect(page).toHaveURL(/\/signin/);
});

test("unauthenticated visit to /submit redirects to sign-in", async ({
  page,
}) => {
  await page.goto("/submit");
  await expect(page).toHaveURL(/\/signin/);
});
