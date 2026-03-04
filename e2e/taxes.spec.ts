import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Tax Overview", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "taxes");
  });

  test("should show tax page with heading and year selector", async ({ page }) => {
    await page.goto("/taxes");

    // Heading contains "Taxes" (i18n: taxes.title)
    await expect(page.locator("h1")).toContainText(/taxes/i);

    // Year selector is present with current year selected
    const yearSelect = page.locator('[data-testid="select-year"]');
    await expect(yearSelect).toBeVisible();
    const currentYear = new Date().getFullYear().toString();
    await expect(yearSelect).toHaveValue(currentYear);
  });

  test("should show profile warning when profile is incomplete", async ({ page }) => {
    await page.goto("/taxes");

    // Wait for the API response to load tax overview data
    await page.waitForResponse(
      (res) => res.url().includes("/api/taxes/overview") && res.status() === 200,
      { timeout: 10_000 }
    );

    // A freshly registered user has no profile, so profileIncomplete is true
    // The warning banner uses border-amber-200 and bg-amber-50
    const warning = page.locator('[data-testid="profile-warning"]');
    await expect(warning).toBeVisible({ timeout: 5_000 });

    // The banner should mention completing the profile
    await expect(warning).toContainText(/profile|settings/i);

    // It should contain a button that navigates to settings
    const settingsButton = warning.locator("button");
    await expect(settingsButton).toBeVisible();
  });

  test("should navigate to simulator from the overview link", async ({ page }) => {
    await page.goto("/taxes");

    // Wait for overview data to load so the link is rendered
    await page.waitForResponse(
      (res) => res.url().includes("/api/taxes/overview") && res.status() === 200,
      { timeout: 10_000 }
    );

    // Click the simulator link (i18n: taxes.simulatorLink = "Try different scenarios →")
    const simulatorLink = page.locator('a[href="/taxes/simulator"]');
    await expect(simulatorLink).toBeVisible({ timeout: 5_000 });
    await simulatorLink.click();

    await expect(page).toHaveURL("/taxes/simulator", { timeout: 5_000 });
  });

  test("should allow changing year via the year selector", async ({ page }) => {
    await page.goto("/taxes");

    const yearSelect = page.locator('[data-testid="select-year"]');
    await expect(yearSelect).toBeVisible();

    const currentYear = new Date().getFullYear();
    const previousYear = (currentYear - 1).toString();

    await yearSelect.selectOption(previousYear);
    await expect(yearSelect).toHaveValue(previousYear);

    // Page should remain on /taxes and not crash
    await expect(page).toHaveURL("/taxes");
    await expect(page.locator("h1")).toContainText(/taxes/i);
  });
});

test.describe("Tax Simulator", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "simulator");
  });

  test("should show simulator with all input fields", async ({ page }) => {
    await page.goto("/taxes/simulator");

    // Heading
    await expect(page.locator("h1")).toContainText(/simulator/i);

    // Revenue input (id="fatturato")
    await expect(page.locator('input[id="fatturato"]')).toBeVisible();

    // ATECO code input (id="codiceAteco")
    await expect(page.locator('input[id="codiceAteco"]')).toBeVisible();

    // Gestione INPS select (id="gestione")
    await expect(page.locator('select[id="gestione"]')).toBeVisible();

    // Start year input (id="annoInizio")
    await expect(page.locator('input[id="annoInizio"]')).toBeVisible();

    // Fiscal year input (id="annoFiscale")
    await expect(page.locator('input[id="annoFiscale"]')).toBeVisible();
  });

  test("should show empty state when no revenue entered", async ({ page }) => {
    await page.goto("/taxes/simulator");

    // The empty state is rendered when fatturato <= 0
    // It contains a dashed border and descriptive text
    const emptyState = page.locator('[data-testid="simulator-empty-state"]');
    await expect(emptyState).toBeVisible({ timeout: 5_000 });
    await expect(emptyState).toContainText(/revenue|fatturato/i);
  });

  test("should compute and show results when valid revenue and ATECO are entered", async ({
    page,
  }) => {
    await page.goto("/taxes/simulator");

    // Fill in annual revenue
    await page.fill('input[id="fatturato"]', "50000");

    // Fill in a valid ATECO code (62.01.09 = IT consultants, coeff 78%)
    await page.fill('input[id="codiceAteco"]', "62.01.09");

    // Result cards should appear — three Cards for imposta, INPS, net position
    const resultCards = page.locator('[data-testid="simulator-results"]');
    await expect(resultCards).toBeVisible({ timeout: 5_000 });

    // Verify "Tax Due" label is visible inside a result card (uses span, not a heading)
    await expect(page.locator("span:has-text('Tax Due')")).toBeVisible();

    // Download simulated F24 card should also be visible
    await expect(
      page.locator('[data-testid="btn-download-f24-primo-acconto"]')
    ).toBeVisible();
  });

  test("should show error for unknown ATECO code", async ({ page }) => {
    await page.goto("/taxes/simulator");

    await page.fill('input[id="fatturato"]', "50000");
    await page.fill('input[id="codiceAteco"]', "00.00.00");

    // calcError is rendered in a destructive/red banner
    const errorBanner = page.locator('[data-testid="error-banner"]');
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
  });

  test("should navigate back to tax overview via back button", async ({ page }) => {
    await page.goto("/taxes/simulator");

    // The back button navigates to /taxes (uses navigate("/taxes"))
    // It contains the text from common.back ("Back")
    const backButton = page.locator('[data-testid="btn-back"]');
    await expect(backButton).toBeVisible();
    await backButton.click();

    await expect(page).toHaveURL("/taxes", { timeout: 5_000 });
  });
});
