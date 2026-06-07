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

// Drive the two-phase session form (step 16.2). Phase 1 (pick): in slot N, tap
// "+ New" and type the name. Scores are entered in phase 2 (after continueToScores).
export async function pickNewPlayer(
  page: Page,
  n: number,
  name: string,
): Promise<void> {
  const slot = page.getByRole("group", { name: `Player ${n}` });
  await slot.getByRole("button", { name: "+ New" }).click();
  await slot.getByRole("textbox", { name: `New player name ${n}` }).fill(name);
}

// Advance from the pick phase to the score phase.
export async function continueToScores(page: Page): Promise<void> {
  await page.getByRole("button", { name: /continue to scores/i }).click();
}

// Set the wins for a slot in the score phase via the segmented buttons.
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

// Submit a full session of N on-the-fly new players via the two-phase form
// (step 16.2): pick everyone, continue, score each, then Log Results. Assumes
// the caller is already on /submit. `names.length` must equal `wins.length`.
export async function submitNewSession(
  page: Page,
  names: string[],
  wins: number[],
): Promise<void> {
  for (let i = 0; i < names.length; i++) {
    await pickNewPlayer(page, i + 1, names[i]);
  }
  await continueToScores(page);
  for (let i = 0; i < wins.length; i++) {
    await setSlotWins(page, i + 1, wins[i]);
  }
  await page.getByRole("button", { name: /log results/i }).click();
}

export { expect };
