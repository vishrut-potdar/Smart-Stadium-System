import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function scan(page: import("@playwright/test").Page, selector: string) {
  return new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa"]).analyze();
}

test("Home scorecard has no critical a11y violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scorecard")).toBeVisible();
  const results = await scan(page, '[data-testid="scorecard"]');
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("SOS timeline/staff area has no critical a11y violations", async ({ page }) => {
  await page.goto("/sos");
  // trigger the timeline so its state is present in the DOM
  const button = page.getByTestId("sos-button");
  const box = await button.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
  }
  await expect(page.getByTestId("staff-list")).toBeVisible();
  const results = await scan(page, '[data-testid="staff-list"]');
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("Seat map UI has no critical a11y violations", async ({ page }) => {
  await page.goto("/seating");
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
