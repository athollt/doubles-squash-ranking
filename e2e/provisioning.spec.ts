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

test("an admin creates a league and assigns a scorer; the scorer then sees only their league", async ({
  page,
}) => {
  const token = `${Date.now()}`;
  const slug = `e2e-prov-${token}`;
  const display = `[e2e] Provisioned ${token}`;
  const scorerEmail = `e2e-prov-${token}@club.test`;

  // Admin provisions a new league.
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/leagues");
  await page.getByRole("textbox", { name: "League name" }).fill(display);
  // Display name auto-fills from the name; override the slug to our token.
  const slugField = page.getByRole("textbox", { name: "Slug" });
  await slugField.fill(slug);
  await page.getByRole("button", { name: "Create league" }).click();

  // The new league's public ladder is now reachable.
  await expect(async () => {
    const res = await page.goto(`/l/${slug}`);
    expect(res?.status()).toBe(200);
  }).toPass();

  // Assign the new scorer to the new league.
  await page.goto("/admin/leagues");
  await page.getByRole("textbox", { name: "Scorer email" }).fill(scorerEmail);
  await page.getByRole("textbox", { name: "Scorer name" }).fill(`[e2e] Scorer ${token}`);
  await page.getByLabel("League", { exact: true }).selectOption({ label: display });
  await page.getByRole("button", { name: "Assign scorer" }).click();
  await expect(page.getByText(/scorer assigned/i)).toBeVisible();
  // The provisioned scorer has no password (Google-only); the "sees only their
  // league" behaviour is covered by the fixture scorer test below, which has a
  // known credentials password. Here we've verified create + assign succeed.
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
