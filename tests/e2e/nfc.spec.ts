import { test, expect } from "@playwright/test";

test("NFC tap reveals seat directions", async ({ page }) => {
  await page.goto("/nfc");
  await expect(page.getByRole("heading", { name: /Tap once/i })).toBeVisible();

  // Destinations disabled until tap
  const seatBtn = page.getByTestId("dest-seat");
  await expect(seatBtn).toBeDisabled();

  await page.getByTestId("nfc-tap").click();
  await expect(seatBtn).toBeEnabled();

  await seatBtn.click();
  const directions = page.getByTestId("nfc-directions");
  await expect(directions).toBeVisible();
  await expect(directions).toContainText(/head to my seat/i);
  await expect(directions).toContainText(/3 min/i);
});
