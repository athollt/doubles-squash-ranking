import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";
import { TEST_SCORER, OTHER_LEAGUE } from "./fixtures";

// Step 04 middleware: unauthenticated access to protected routes redirects to
// the sign-in page.
test("unauthenticated visit to /admin/players redirects to sign-in", async ({
  page,
}) => {
  await page.goto("/l/bsc-doubles-squash/admin/players");
  await expect(page).toHaveURL(/\/signin/);
});

test("unauthenticated visit to /submit redirects to sign-in", async ({
  page,
}) => {
  await page.goto("/l/bsc-doubles-squash/submit");
  await expect(page).toHaveURL(/\/signin/);
});

// Step 21 / ADR-012: per-league authz at the page boundary.
test("a granted scorer can open their league's submit page", async ({ page }) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  await page.goto("/l/bsc-doubles-squash/submit");
  await expect(page).toHaveURL(/\/l\/bsc-doubles-squash\/submit$/);
  await expect(page.getByRole("heading", { name: /submit a session/i })).toBeVisible();
});

test("a scorer without a grant is bounced from another league's submit page", async ({
  page,
}) => {
  await signIn(page, TEST_SCORER.email, TEST_SCORER.password);
  // The test scorer is granted BSC, not OTHER_LEAGUE → unauthorised.
  await page.goto(`/l/${OTHER_LEAGUE.slug}/submit`);
  await expect(page).toHaveURL(/\/unauthorised/);
});

test("an unknown league slug returns 404 on a public ladder", async ({ page }) => {
  const res = await page.goto("/l/no-such-league");
  expect(res?.status()).toBe(404);
});
