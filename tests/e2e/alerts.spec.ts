import { test, expect } from "@playwright/test";

test("alerts page shows live alert cards and a weather widget", async ({ page }) => {
  await page.goto("/alerts");

  const list = page.getByTestId("alerts-list");
  await expect(list).toBeVisible();

  // At least one alert card renders once polling / WS resolves
  await expect(page.getByTestId("alert-card").first()).toBeVisible({ timeout: 10000 });

  const weather = page.getByTestId("weather-widget");
  await expect(weather).toBeVisible({ timeout: 10000 });
  await expect(weather).toContainText(/°C/);
});

test("transport badge falls back to polling when WS is blocked", async ({ page, context }) => {
  // Block the WebSocket endpoint at the network layer
  await context.route("**/api/live/socket*", (route) => route.abort());
  await page.goto("/alerts");

  // Wait for the transport badge on the weather card to settle to Polling
  const badge = page.getByTestId("transport-badge").first();
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("data-transport", "polling", { timeout: 8000 });
});
