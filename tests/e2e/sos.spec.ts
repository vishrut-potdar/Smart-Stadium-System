import { test, expect } from "@playwright/test";

test("SOS hold triggers alert and shows staff", async ({ page }) => {
  await page.goto("/sos");
  const list = page.getByTestId("staff-list");
  await expect(list).toContainText(/Hold the button/i);

  const button = page.getByTestId("sos-button");
  const box = await button.boundingBox();
  if (!box) throw new Error("no button box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1500);
  await page.mouse.up();

  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(list).toContainText(/Medical/);
  await expect(list).toContainText(/Security/);
  await expect(list).toContainText(/ETA/);
});
