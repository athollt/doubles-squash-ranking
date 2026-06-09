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

// Drive the single-grid session form (step 17). Add an on-the-fly player: tap
// "+ New" in the "Choose players" grid — the chip becomes a name field — type the
// name and confirm ("Add player"). This creates a named score block.
export async function addNewPlayer(page: Page, name: string): Promise<void> {
  const grid = page.getByRole("group", { name: "Choose players" });
  await grid.getByRole("button", { name: "+ New" }).click();
  await grid.getByRole("textbox", { name: "New player name" }).fill(name);
  await grid.getByRole("button", { name: "Add player" }).click();
}

// Set the wins for the score block named `name` via the segmented buttons.
export async function setPlayerWins(
  page: Page,
  name: string,
  wins: number,
): Promise<void> {
  await page
    .getByRole("group", { name })
    .getByRole("button", { name: `${wins} wins`, exact: true })
    .click();
}

// Submit a full session of N on-the-fly new players via the single-grid form:
// add + name each, set their wins, then Log Results. A successful submit lands on
// the "Session logged ✓" success screen (step 16.4); this clicks "View ladder" to
// reach the ladder. Assumes the caller is on /submit; `names.length` == `wins.length`.
export async function submitNewSession(
  page: Page,
  names: string[],
  wins: number[],
): Promise<void> {
  for (let i = 0; i < names.length; i++) {
    await addNewPlayer(page, names[i]);
    await setPlayerWins(page, names[i], wins[i]);
  }
  await page.getByRole("button", { name: /log results/i }).click();
  await page.getByRole("button", { name: /view ladder/i }).click();
}

export { expect };
