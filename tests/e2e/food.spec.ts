import { test, expect } from "@playwright/test";

test("Food pre-order flows into order tracking", async ({ page }) => {
  await page.goto("/food");

  await page.getByTestId("add-1").click(); // Signature Beef Slider
  await page.getByTestId("add-2").click(); // Truffle Fries

  await expect(page.getByTestId("cart-list")).toContainText(/Beef Slider/);
  await expect(page.getByTestId("cart-total")).toContainText(/10\.50/);

  await page.getByTestId("checkout").click();

  const tracker = page.getByTestId("order-tracker").first();
  await expect(tracker).toBeVisible();
  await expect(tracker.getByTestId("order-stage")).toBeVisible();
  await expect(tracker).toContainText(/ETA/);
});
