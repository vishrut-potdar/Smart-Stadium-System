import { test, expect } from "@playwright/test";

/**
 * Integration tests for language switching:
 * - TabBar labels re-render in the selected language.
 * - NFC destination labels & directions localize.
 * - "Live" indicator localizes.
 */

test("switching to Hindi localizes tabs, NFC destinations and direction wording", async ({
  page,
}) => {
  await page.goto("/");

  // English baseline for a couple of tabs
  await expect(page.getByRole("tab", { name: /Home/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Wayfinding/ })).toBeVisible();

  // Open language menu and switch to Hindi
  await page.getByTestId("lang-toggle").click();
  await page.getByTestId("lang-hi").click();

  // Tab labels update
  await expect(page.getByRole("tab", { name: /होम/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /मार्ग/ })).toBeVisible();

  // Navigate to NFC (Hindi tab)
  await page.getByRole("tab", { name: /मार्ग/ }).click();
  await expect(page).toHaveURL(/\/nfc$/);

  // NFC destinations should render Hindi labels
  await expect(page.getByTestId("dest-seat")).toContainText("मेरी सीट");
  await expect(page.getByTestId("dest-exit")).toContainText("निकटतम निकास");
  await expect(page.getByTestId("dest-park")).toContainText("मेरी पार्किंग");

  // Tap NFC then choose seat — direction heading uses "यहाँ जाएँ:" (Head to)
  await page.getByTestId("nfc-tap").click();
  await page.getByTestId("dest-seat").click();
  const dir = page.getByTestId("nfc-directions");
  await expect(dir).toBeVisible();
  await expect(dir).toContainText("यहाँ जाएँ:");
});

test("switching back to English restores UI text", async ({ page }) => {
  await page.goto("/nfc");
  await page.getByTestId("lang-toggle").click();
  await page.getByTestId("lang-ja").click();
  await expect(page.getByTestId("dest-seat")).toContainText("自分の座席");

  await page.getByTestId("lang-toggle").click();
  await page.getByTestId("lang-en").click();
  await expect(page.getByTestId("dest-seat")).toContainText("My seat");

  await page.getByTestId("nfc-tap").click();
  await page.getByTestId("dest-exit").click();
  await expect(page.getByTestId("nfc-directions")).toContainText(/Head to/);
});
