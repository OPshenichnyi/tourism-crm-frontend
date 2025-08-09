import { test, expect } from "@playwright/test";

test("homepage renders", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const content = await page.content();
  expect(content.length).toBeGreaterThan(100);
});
