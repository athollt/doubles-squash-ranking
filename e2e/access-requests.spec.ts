import { test, type Page } from "@playwright/test";
import { signIn, expect } from "./helpers";
import {
  TEST_ADMIN,
  TEST_NONSTAFF,
  LEAGUE_SLUG,
  OTHER_LEAGUE,
} from "./fixtures";

// Step 23 — non-staff bounce + access request + admin review (ADR-014). The
// fixture non-staff user is a SCORER-role account with NO grant, so the landing
// bounces them to /request-access (the credentials stand-in for a fresh Google
// sign-in with no access). One serial journey: bounce → new-league request →
// existing-league request → dismiss (no access) → approve (access granted).
// Dismiss runs before approve so the user is still grant-less when it asserts
// "still barred"; the approve grant lands last.

async function requestAccessFor(page: Page, label: string, notes: string) {
  await page.goto("/request-access");
  await page.getByLabel(/which league/i).selectOption({ label });
  await page.getByLabel(/notes/i).fill(notes);
  await page.getByRole("button", { name: "Request access" }).click();
  await expect(page.getByText(/request sent/i)).toBeVisible();
}

test("a non-staff user is bounced, requests access (incl. a new league), and an admin reviews", async ({
  page,
}) => {
  // A plain sign-in (no gated-page callbackUrl) lands a grant-less non-staff
  // user on the bounce page — the post-login target defaults to /request-access.
  await signIn(page, TEST_NONSTAFF.email, TEST_NONSTAFF.password);
  await expect(page).toHaveURL(/\/request-access$/);
  await expect(
    page.getByRole("heading", { name: /scorers & admins only/i }),
  ).toBeVisible();

  // Issue #1: `/` does NOT force-redirect a grant-less user back to the bounce —
  // they browse the public landing like any visitor.
  await page.goto("/");
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { name: "Rungs" })).toBeVisible();

  // A "set up a new league" request (no existing league) carries notes; the
  // admin sees it labelled as a new-league request and dismisses it.
  await requestAccessFor(page, "Set up a new league…", "Padel at Westville");
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/access-requests");
  await expect(page.getByText(/set up a new league/i)).toBeVisible();
  await expect(page.getByText("Padel at Westville")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).first().click();
  await expect(page.getByText(/set up a new league/i)).toHaveCount(0);

  // An existing-league request the admin DISMISSES — no grant created.
  await signIn(page, TEST_NONSTAFF.email, TEST_NONSTAFF.password);
  await requestAccessFor(page, OTHER_LEAGUE.name, "");
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/access-requests");
  await expect(page.getByText(OTHER_LEAGUE.name).first()).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).first().click();
  await expect(page.getByText(OTHER_LEAGUE.name)).toHaveCount(0);
  // The dismissed league's scorer surface stays barred.
  await signIn(page, TEST_NONSTAFF.email, TEST_NONSTAFF.password);
  await page.goto(`/l/${OTHER_LEAGUE.slug}/submit`);
  await expect(page).toHaveURL(/\/unauthorised$/);

  // A request for the BSC league which the admin APPROVES.
  await requestAccessFor(page, "Doubles Squash @ BSC", "");
  await signIn(page, TEST_ADMIN.email, TEST_ADMIN.password);
  await page.goto("/admin/access-requests");
  await expect(page.getByText(TEST_NONSTAFF.email).first()).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByText(TEST_NONSTAFF.email)).toHaveCount(0);

  // The user now has access: no longer bounced, BSC shows on the landing, and
  // its submit page is reachable.
  await signIn(page, TEST_NONSTAFF.email, TEST_NONSTAFF.password);
  await page.goto("/");
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(
    page.getByRole("link", { name: /Doubles Squash @ BSC/i }),
  ).toBeVisible();
  const res = await page.goto(`/l/${LEAGUE_SLUG}/submit`);
  expect(res?.status()).toBe(200);
});
