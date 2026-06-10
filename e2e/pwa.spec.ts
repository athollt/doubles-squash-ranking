import { test, expect } from "@playwright/test";

// Step 13 — PWA & branding. Verifies the manifest is served and the branding
// meta tags are present in the document head on the public ladder page.
test("manifest.json is served with the correct fields", async ({ request }) => {
  const res = await request.get("/manifest.json");
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toBe("Rungs");
  expect(manifest.short_name).toBe("Rungs");
  expect(manifest.display).toBe("standalone");
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
});

test("the ladder page links the manifest, apple touch icon and OG image", async ({
  page,
}) => {
  await page.goto("/l/bsc-doubles-squash");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /manifest\.json/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    /apple-touch-icon\.png/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /og\.png/,
  );
  // The league page title leads with the Rungs brand, then the league's own name
  // (step 24): "Rungs - Doubles Squash @ BSC".
  await expect(page).toHaveTitle("Rungs - Doubles Squash @ BSC");
});
