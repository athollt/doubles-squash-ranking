import { type Page, expect } from "@playwright/test";

// Sign in via the credentials form on /signin. On success the form does a full
// navigation to the callback URL; wait for it to leave /signin so the session
// cookie is established before the caller navigates. On failure the form stays
// on /signin showing an error — callers expecting denial pass { expectError }.
export async function signIn(
  page: Page,
  email: string,
  password: string,
  opts: { expectError?: boolean } = {},
): Promise<void> {
  await page.goto("/signin");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  // Scope to the form (main) — the global header now also has a "Sign in" button
  // (step 16.1: header → Google), so match the credentials submit specifically.
  await page
    .getByRole("main")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  if (opts.expectError) {
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  } else {
    // Wait until the post-login full reload has left /signin.
    await page.waitForURL((url) => !url.pathname.startsWith("/signin"));
  }
}

// Drive the redesigned session form (step 13.5): per slot, scoped via the `Player N`
// group, tap "+ New", type the name, then tap the segmented `wins` button.
export async function addNewPlayer(
  page: Page,
  n: number,
  name: string,
  wins: number,
): Promise<void> {
  const slot = page.getByRole("group", { name: `Player ${n}` });
  await slot.getByRole("button", { name: "+ New" }).click();
  await slot.getByRole("textbox", { name: `New player name ${n}` }).fill(name);
  await slot.getByRole("button", { name: `${wins} wins`, exact: true }).click();
}

// Set the wins for an existing slot (edit flow) via the segmented buttons.
export async function setSlotWins(
  page: Page,
  n: number,
  wins: number,
): Promise<void> {
  await page
    .getByRole("group", { name: `Player ${n}` })
    .getByRole("button", { name: `${wins} wins`, exact: true })
    .click();
}

export { expect };
