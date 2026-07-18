import { test, expect } from "@playwright/test";

test("NFC tap in Spanish renders seat/exit/parking directions in the selected language", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("lang-toggle").click();
  await page.getByTestId("lang-es").click();

  await page.goto("/nfc");

  // Destinations render Spanish labels
  await expect(page.getByTestId("dest-seat")).toContainText("Mi asiento");
  await expect(page.getByTestId("dest-exit")).toContainText("Salida más cercana");
  await expect(page.getByTestId("dest-park")).toContainText("Mi aparcamiento");

  // Buttons disabled until tap
  await expect(page.getByTestId("dest-seat")).toBeDisabled();
  await page.getByTestId("nfc-tap").click();

  // Seat directions
  await page.getByTestId("dest-seat").click();
  const dir = page.getByTestId("nfc-directions");
  await expect(dir).toBeVisible();
  await expect(dir).toContainText("Dirígete a:");
  await expect(dir).toContainText("mi asiento");
  await expect(page.getByTestId("nfc-steps").locator("li")).toHaveCount(4);

  // Exit directions
  await page.getByTestId("dest-exit").click();
  await expect(dir).toContainText("salida más cercana");

  // Parking directions
  await page.getByTestId("dest-park").click();
  await expect(dir).toContainText("mi aparcamiento");
});
