import { test, expect } from "@playwright/test";

test.describe("polling fallback when WebSocket is blocked", () => {
  test.beforeEach(async ({ context }) => {
    // Block the WS endpoint at the network layer so useLiveFeed must fall back.
    await context.route("**/api/live/socket*", (route) => route.abort());
  });

  test("crowd page falls back to polling and renders spots", async ({ page }) => {
    await page.goto("/crowd");
    const badge = page.getByTestId("transport-badge").first();
    await expect(badge).toHaveAttribute("data-transport", "polling", { timeout: 8000 });
    // At least one crowd card renders (uses percentage text)
    await expect(page.locator('[role="progressbar"]').first()).toBeVisible({ timeout: 8000 });
  });

  test("alerts page falls back to polling for both alerts and weather", async ({ page }) => {
    await page.goto("/alerts");

    // Both transport badges (weather + alerts) should settle to polling
    const badges = page.getByTestId("transport-badge");
    await expect(badges.first()).toHaveAttribute("data-transport", "polling", { timeout: 8000 });
    await expect(badges.nth(1)).toHaveAttribute("data-transport", "polling", { timeout: 8000 });

    // Weather widget populates
    const weather = page.getByTestId("weather-widget");
    await expect(weather).toBeVisible({ timeout: 10000 });
    await expect(weather).toContainText(/°C/);

    // At least one alert card appears from the polling endpoint
    await expect(page.getByTestId("alert-card").first()).toBeVisible({ timeout: 10000 });
  });
});
