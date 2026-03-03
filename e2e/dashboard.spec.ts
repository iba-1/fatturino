import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "dashboard");
  });

  test("should display dashboard title and year selector", async ({ page }) => {
    // After registerAndLogin we are already on /
    await expect(page.locator("h1")).toContainText(/dashboard/i);

    // Year selector should be visible with the current year
    const yearSelect = page.locator("select");
    await expect(yearSelect).toBeVisible();
    const currentYear = new Date().getFullYear().toString();
    await expect(yearSelect).toHaveValue(currentYear);
  });

  test("should show 4 summary cards", async ({ page }) => {
    // The grid of summary cards lives inside a grid container with 4 Card children
    const cards = page.locator(".grid.gap-4 > div");
    await expect(cards).toHaveCount(4, { timeout: 10_000 });

    // Each card should have a title (h3) and a value (p)
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i).locator("h3")).toBeVisible();
      await expect(cards.nth(i).locator("p")).toBeVisible();
    }
  });

  test("should show profile warning for a new user with incomplete profile", async ({
    page,
  }) => {
    // A freshly registered user has no codice_ateco, partita_iva, etc.
    // so profileIncomplete should be true and the warning banner should appear.
    // Wait for the API response to load the dashboard data.
    await page.waitForResponse(
      (res) => res.url().includes("/api/dashboard/summary") && res.status() === 200,
      { timeout: 10_000 },
    );

    // The yellow warning banner should be visible
    const warning = page.locator(".border-yellow-300, .border-yellow-700");
    await expect(warning).toBeVisible();

    // It should contain a link/button to settings
    const settingsLink = warning.locator("button");
    await expect(settingsLink).toBeVisible();
  });

  test("should allow changing year without crashing", async ({ page }) => {
    const yearSelect = page.locator("select");
    await expect(yearSelect).toBeVisible();

    const currentYear = new Date().getFullYear();
    const previousYear = (currentYear - 1).toString();

    // Change to previous year
    await yearSelect.selectOption(previousYear);
    await expect(yearSelect).toHaveValue(previousYear);

    // Dashboard should still be visible and not crash
    await expect(page.locator("h1")).toContainText(/dashboard/i);

    // Summary cards should still be rendered (may show zeroes)
    const cards = page.locator(".grid.gap-4 > div");
    await expect(cards).toHaveCount(4, { timeout: 10_000 });
  });
});
